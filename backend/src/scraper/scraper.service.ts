import {
	HttpException,
	HttpStatus,
	Injectable,
	Logger,
	OnModuleInit,
	RequestTimeoutException,
	ServiceUnavailableException,
} from "@nestjs/common";
import {
	createPlaywrightRouter,
	Dataset,
	PlaywrightCrawler,
	type PlaywrightCrawlingContext,
	RequestQueue,
} from "crawlee";
import type { Page } from "playwright";
import { parseProductListHtml } from "./product-list.parser";

export enum RouteLabel {
	HOME = "HOME",
	CATEGORY = "CATEGORY",
	PRODUCT = "PRODUCT",
}

export interface CategoryData {
	title: string;
	url: string;
	imageUrl: string | null;
	slug: string;
	description: string | null;
}

export interface ProductCondition {
	type: "new" | "like_new" | "very_good" | "good" | "acceptable" | "unknown";
	label: string;
	price: number;
	available: boolean;
	variantId: string;
	sku: string | null;
	stock: number | null;
}

export interface ProductListItem {
	sourceId: string;
	title: string;
	author: string | null;
	price: number;
	currency: string;
	imageUrl: string | null;
	url: string;
	slug: string;
}

export interface ProductDetail {
	sourceId: string;
	title: string;
	author: string | null;
	price: number;
	currency: string;
	imageUrl: string | null;
	imageUrls: string[];
	url: string;
	slug: string;
	description: string | null;
	specs: Record<string, string>;
	conditions: ProductCondition[];
	inStock: boolean;
	rrp: number | null;
	series: string | null;
}

export interface ScrapeResult<T> {
	success: boolean;
	data: T | null;
	error: string | null;
	scrapedAt: Date;
	url: string;
}

export interface PaginationInfo {
	currentPage: number;
	totalPages: number | null;
	nextPageUrl: string | null;
}

export interface ScrapeOptions {
	page?: number;
}

export interface BatchScrapeOptions {
	batchSize?: number;
	delayMs?: number;
}

@Injectable()
export class ScraperService implements OnModuleInit {
	private readonly logger = new Logger(ScraperService.name);
	private readonly baseUrl = "https://www.worldofbooks.com";
	private readonly localizedBaseUrl = "https://www.worldofbooks.com/en-gb";
	private crawler: PlaywrightCrawler;
	private router: ReturnType<typeof createPlaywrightRouter>;

	private readonly userAgents = [
		"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
		"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
		"Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
		"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15",
		"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
	];

	onModuleInit(): void {
		this.router = this.createRouter();
		this.crawler = this.createCrawler();
		this.logger.log("ScraperService initialized");
	}

	private getRandomUserAgent(): string {
		return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
	}

	private createCrawler(): PlaywrightCrawler {
		return new PlaywrightCrawler({
			requestHandler: this.router,
			headless: true,
			launchContext: {
				launchOptions: {
					args: [
						"--disable-dev-shm-usage",
						"--disable-setuid-sandbox",
						"--no-sandbox",
						"--disable-blink-features=AutomationControlled",
						"--disable-infobars",
						"--window-size=1920,1080",
					],
				},
			},
			maxRequestsPerMinute: 12,
			maxConcurrency: 1,
			navigationTimeoutSecs: 90,
			requestHandlerTimeoutSecs: 180,
			maxRequestRetries: 3,
			browserPoolOptions: {
				useFingerprints: true,
				fingerprintOptions: {
					fingerprintGeneratorOptions: {
						browsers: ["chrome", "firefox", "safari"],
						devices: ["desktop"],
						operatingSystems: ["windows", "macos", "linux"],
					},
				},
			},
			preNavigationHooks: [
				async ({ page, request }) => {
					await page.addInitScript(() => {
						Object.defineProperty(navigator, "webdriver", {
							get: () => undefined,
						});
						Object.defineProperty(navigator, "plugins", {
							get: () => [1, 2, 3, 4, 5],
						});
						Object.defineProperty(navigator, "languages", {
							get: () => ["en-GB", "en-US", "en"],
						});
					});

					this.logger.debug(`Navigating to: ${request.url}`);
				},
			],
			postNavigationHooks: [
				async ({ page }) => {
					try {
						const consentButton = await page.$(
							'[data-testid="accept-cookies"], #onetrust-accept-btn-handler, .cookie-accept, button:has-text("Accept")',
						);
						if (consentButton) {
							await consentButton.click();
							await page.waitForTimeout(500);
						}
					} catch {
						// Consent banner not found
					}

					try {
						await page.waitForLoadState("networkidle", { timeout: 15000 });
					} catch {
						this.logger.warn("Network idle timeout - proceeding");
						await page.waitForLoadState("domcontentloaded");
					}

					await page.waitForTimeout(Math.random() * 1000 + 500);
				},
			],
			failedRequestHandler: ({ request }, error) => {
				const statusCode = (error as any)?.statusCode;
				this.logger.error(
					`Request failed: ${request.url} | Status: ${statusCode || "N/A"} | Error: ${error.message}`,
				);

				if (statusCode === 403 || statusCode === 429) {
					throw new ServiceUnavailableException(
						`Blocked by target site (${statusCode}). Please try again later.`,
					);
				}
				if (
					error.message.includes("timeout") ||
					error.message.includes("Timeout")
				) {
					throw new RequestTimeoutException(
						`Request timed out for ${request.url}`,
					);
				}
			},
		});
	}

	private createRouter(): ReturnType<typeof createPlaywrightRouter> {
		const router = createPlaywrightRouter();

		router.addHandler(RouteLabel.HOME, this.handleHomePage.bind(this));
		router.addHandler(RouteLabel.CATEGORY, this.handleCategoryPage.bind(this));
		router.addHandler(RouteLabel.PRODUCT, this.handleProductPage.bind(this));

		router.addDefaultHandler((context) => {
			this.logger.warn(`No handler for URL: ${context.request.url}`);
		});

		return router;
	}

	private async handleHomePage(
		context: PlaywrightCrawlingContext,
	): Promise<void> {
		const { page, request } = context;
		this.logger.log(`Processing HOME: ${request.url}`);

		try {
			await page.waitForSelector("section.section-collection-list", {
				timeout: 30000,
				state: "visible",
			});

			await page.waitForTimeout(2000);

			const categories = await page.$$eval(
				"section.section-collection-list li.collection-list__item",
				(items, baseUrlParam) => {
					return items.map((item) => {
						const linkEl =
							item.querySelector("h3.card__heading a.full-unstyled-link") ||
							item.querySelector(".card__information h3.card__heading a") ||
							item.querySelector("a[href*='/collections/']");

						const imgEl = item.querySelector(".card__media img");

						const title = linkEl?.textContent?.trim() || "";
						const href = linkEl?.getAttribute("href") || "";

						const captionEl = item.querySelector(
							".card__caption, p.card__caption",
						);
						const description =
							captionEl?.textContent?.trim()?.replace(/\s+/g, " ") || null;

						let imageUrl: string | null = null;
						if (imgEl) {
							const srcset = imgEl.getAttribute("srcset");
							const src = imgEl.getAttribute("src");

							if (srcset) {
								const sources = srcset.split(",").map((s) => s.trim());
								const lastSource = sources[sources.length - 1];
								const imgSrc = lastSource?.split(" ")[0] || null;
								if (imgSrc) {
									imageUrl = imgSrc.startsWith("//")
										? `https:${imgSrc}`
										: imgSrc.startsWith("http")
											? imgSrc
											: `${baseUrlParam}${imgSrc}`;
								}
							} else if (src) {
								imageUrl = src.startsWith("//")
									? `https:${src}`
									: src.startsWith("http")
										? src
										: `${baseUrlParam}${src}`;
							}
						}

						let url = href;
						if (!href.startsWith("http")) {
							const cleanHref = href.startsWith("/") ? href : `/${href}`;
							url = `${baseUrlParam}${cleanHref}`;
						}

						const pathParts = href.split("/").filter(Boolean);
						const slug = pathParts[pathParts.length - 1] || "";

						return {
							title,
							url,
							imageUrl,
							slug,
							description,
						};
					});
				},
				this.baseUrl,
			);

			const validCategories = categories.filter((cat): cat is CategoryData =>
				Boolean(cat.title && cat.url && cat.slug),
			);

			await Dataset.pushData({
				type: RouteLabel.HOME,
				url: request.url,
				data: validCategories,
				scrapedAt: new Date().toISOString(),
			});

			this.logger.log(
				`Extracted ${validCategories.length} categories from homepage`,
			);
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : "Unknown error";
			this.logger.error(`Failed to process homepage: ${errorMessage}`);

			throw new HttpException(
				`Failed to scrape categories: ${errorMessage}`,
				HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}

	private async handleCategoryPage(
		context: PlaywrightCrawlingContext,
	): Promise<void> {
		const { page, request } = context;
		this.logger.log(`Processing CATEGORY: ${request.url}`);

		try {
			await page.waitForSelector("div.collection, #hits", {
				timeout: 30000,
				state: "attached",
			});

			let productsLoaded = await this.waitForAlgoliaProducts(page, 45000);

			if (!productsLoaded) {
				this.logger.warn("First attempt failed. Reloading page...");

				await page.reload({ waitUntil: "domcontentloaded" });

				try {
					await page.waitForLoadState("networkidle", { timeout: 15000 });
				} catch {
					this.logger.warn("Network idle timeout after reload - proceeding");
					await page.waitForLoadState("domcontentloaded");
				}

				await page.waitForTimeout(1000);

				productsLoaded = await this.waitForAlgoliaProducts(page, 45000);
			}

			if (!productsLoaded) {
				this.logger.warn(
					`Algolia products did not load after reload for ${request.url}`,
				);

				await this.logPageDebugInfo(page);

				await Dataset.pushData({
					type: RouteLabel.CATEGORY,
					url: request.url,
					data: [],
					pagination: { currentPage: 1, totalPages: null, nextPageUrl: null },
					scrapedAt: new Date().toISOString(),
					error: "Products did not load after retry",
				});
				return;
			}

			// Step 3: Scroll to load more products (infinite scroll)
			await this.autoScroll(page);

			// Step 4: Small delay after scrolling for final renders
			await page.waitForTimeout(1000);

			// Step 5: Extract HTML and parse
			const html = await page.content();
			const validProducts = parseProductListHtml(html);

			const paginationInfo = await this.extractPaginationInfo(page);

			await Dataset.pushData({
				type: RouteLabel.CATEGORY,
				url: request.url,
				data: validProducts,
				pagination: paginationInfo,
				scrapedAt: new Date().toISOString(),
			});

			this.logger.log(
				`Extracted ${validProducts.length} products from category`,
			);
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : "Unknown error";
			this.logger.error(`Failed to process category page: ${errorMessage}`);

			await this.logPageDebugInfo(page);

			throw new HttpException(
				`Failed to scrape category: ${errorMessage}`,
				HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}

	/**
	 * Waits for Algolia InstantSearch to load and populate product cards.
	 * Ensures the skeleton loader is detached before checking for products.
	 */
	private async waitForAlgoliaProducts(
		page: Page,
		timeoutMs = 45000,
	): Promise<boolean> {
		const skeletonWaitTimeout = 15000;
		const pollTimeout = timeoutMs - skeletonWaitTimeout;
		const pollInterval = 500;

		this.logger.debug("Waiting for Algolia products to load...");

		try {
			const skeletonLoader = await page.$("#skeleton-loader");

			if (skeletonLoader) {
				this.logger.debug(
					"Skeleton loader detected, waiting for it to detach...",
				);
				await page.waitForSelector("#skeleton-loader", {
					state: "detached",
					timeout: skeletonWaitTimeout,
				});
				this.logger.debug(
					"Skeleton loader detached, proceeding to check products",
				);
			} else {
				this.logger.debug("No skeleton loader detected");
			}
		} catch (error) {
			this.logger.warn(
				`Skeleton loader did not detach within ${skeletonWaitTimeout}ms, proceeding anyway`,
			);
		}

		const startTime = Date.now();

		while (Date.now() - startTime < pollTimeout) {
			const result = await page.evaluate(() => {
				const hitsList = document.querySelector("ol.ais-InfiniteHits-list");
				const hitsItems = document.querySelectorAll("li.ais-InfiniteHits-item");
				const productCards = document.querySelectorAll(
					".card[data-product-id]",
				);
				const productLinks = document.querySelectorAll("a[data-item_id]");
				const isLoading =
					document.querySelector(".ais-InfiniteHits--empty") !== null;
				const hasNoResults = document
					.querySelector(".ais-InfiniteHits--empty")
					?.textContent?.includes("No results");

				return {
					hasHitsList: hitsList !== null,
					hitsCount: hitsItems.length,
					productCardsCount: productCards.length,
					productLinksCount: productLinks.length,
					isLoading,
					hasNoResults,
				};
			});

			this.logger.debug(`Algolia check: ${JSON.stringify(result)}`);

			if (
				result.productCardsCount > 0 ||
				result.productLinksCount > 0 ||
				result.hitsCount > 0
			) {
				this.logger.debug(
					`Algolia loaded with ${result.productCardsCount} products`,
				);
				return true;
			}

			if (result.hasNoResults) {
				this.logger.debug("Algolia returned no results for this category");
				return true;
			}

			await page.waitForTimeout(pollInterval);
		}

		this.logger.warn(`Algolia products did not load within ${timeoutMs}ms`);
		return false;
	}

	/**
	 * Logs debug information about the current page state
	 */
	private async logPageDebugInfo(page: Page): Promise<void> {
		try {
			const debugInfo = await page.evaluate(() => {
				const getCount = (selector: string) =>
					document.querySelectorAll(selector).length;

				return {
					url: window.location.href,
					title: document.title,
					hasCollection: !!document.querySelector("div.collection"),
					hasHitsContainer: !!document.querySelector("#hits"),
					hasAlgoliaList: !!document.querySelector("ol.ais-InfiniteHits-list"),
					algoliaItemCount: getCount("li.ais-InfiniteHits-item"),
					productCardCount: getCount(".card[data-product-id]"),
					productLinkCount: getCount("a[data-item_id]"),
					mainProductCardCount: getCount(".main-product-card"),
					// Check for loading/error states
					hasLoadingState: !!document.querySelector(".ais-InfiniteHits--empty"),
					loadingText:
						document
							.querySelector(".ais-InfiniteHits--empty")
							?.textContent?.trim() || null,
					// First 500 chars of #hits content
					hitsPreview:
						document.querySelector("#hits")?.innerHTML?.substring(0, 500) ||
						"No #hits element",
				};
			});

			this.logger.debug(
				`Page debug info: ${JSON.stringify(debugInfo, null, 2)}`,
			);
		} catch (e) {
			this.logger.debug("Failed to capture debug info");
		}
	}
	private async handleProductPage(
		context: PlaywrightCrawlingContext,
	): Promise<void> {
		const { page, request } = context;
		this.logger.log(`Processing PRODUCT: ${request.url}`);

		try {
			await page.waitForSelector("product-info, .product, div.product", {
				timeout: 30000,
				state: "visible",
			});

			await page.waitForTimeout(2000);

			const productDetail = await page.evaluate(() => {
				const getText = (selector: string): string | null => {
					const el = document.querySelector(selector);
					return el?.textContent?.trim() || null;
				};

				const getAttr = (selector: string, attr: string): string | null => {
					const el = document.querySelector(selector);
					return el?.getAttribute(attr) || null;
				};

				const sourceId =
					getAttr(
						"form[id*='product-form'] input[name='product-id']",
						"value",
					) ||
					getAttr("[data-product-id]", "data-product-id") ||
					getAttr("product-info", "data-product-id") ||
					"";

				const titleEl = document.querySelector(".product__title h1, h1");
				let title = "";
				if (titleEl) {
					const clone = titleEl.cloneNode(true) as HTMLElement;
					const authorSpan = clone.querySelector(".author-item");
					if (authorSpan) authorSpan.remove();
					title = clone.textContent?.trim() || "";
				}

				const authorEl = document.querySelector(".author-item a, .author-item");
				let author: string | null = null;
				if (authorEl) {
					author = authorEl.textContent?.replace(/^by\s*/i, "").trim() || null;
				}

				const priceText =
					getText(".price-item--regular") ||
					getText(".price-item.price-item--regular") ||
					getText(".price-item") ||
					"0";
				const priceMatch = priceText?.match(/[\d.]+/);
				const price = priceMatch ? parseFloat(priceMatch[0]) : 0;

				const currency = priceText?.includes("£")
					? "GBP"
					: priceText?.includes("$")
						? "USD"
						: priceText?.includes("€")
							? "EUR"
							: "GBP";

				const mainImageEl = document.querySelector(
					".product__media img, .product-media img, media-gallery img",
				);
				const mainImage = mainImageEl?.getAttribute("src") || null;
				const imageUrl = mainImage?.startsWith("//")
					? `https:${mainImage}`
					: mainImage;

				const imageEls = document.querySelectorAll(
					".product__media-list img, media-gallery img",
				);
				const imageUrls: string[] = [];
				imageEls.forEach((img) => {
					let src = img.getAttribute("src");
					if (src) {
						if (src.startsWith("//")) src = `https:${src}`;
						if (!imageUrls.includes(src)) {
							imageUrls.push(src);
						}
					}
				});

				const description =
					getText(".product__description") ||
					getText('[class*="product-description"]') ||
					getText(".rte") ||
					null;

				const specs: Record<string, string> = {};
				const specRows = document.querySelectorAll(
					".product-specifications tr, .product-specs li, [class*='spec'] tr",
				);
				specRows.forEach((row) => {
					const label = row
						.querySelector("th, .spec-label, td:first-child")
						?.textContent?.trim();
					const value = row
						.querySelector("td:last-child, .spec-value")
						?.textContent?.trim();
					if (label && value && label !== value) {
						specs[label] = value;
					}
				});

				type ConditionType =
					| "new"
					| "like_new"
					| "very_good"
					| "good"
					| "acceptable"
					| "unknown";

				const conditions: Array<{
					type: ConditionType;
					label: string;
					price: number;
					available: boolean;
					variantId: string;
					sku: string | null;
					stock: number | null;
				}> = [];

				const variantInputs = document.querySelectorAll(
					'.condition-selector-container input[type="radio"], .variants-selector input[name="condition"]',
				);

				variantInputs.forEach((input) => {
					const inputEl = input as HTMLInputElement;

					const conditionValue = inputEl.getAttribute("data-condition") || "";
					const priceAttr = inputEl.getAttribute("data-price") || "0";
					const stockAttr = inputEl.getAttribute("data-stock");
					const skuAttr = inputEl.getAttribute("data-sku");
					const variantId = inputEl.value || "";

					const conditionPrice = parseFloat(priceAttr) / 100 || 0;
					const stock = stockAttr ? parseInt(stockAttr, 10) : null;
					const isAvailable =
						!inputEl.disabled && (!stockAttr || parseInt(stockAttr, 10) > 0);

					const normalizedCondition = conditionValue
						.toLowerCase()
						.replace(/[\s-]/g, "_");

					let type: ConditionType = "unknown";
					if (normalizedCondition === "new") type = "new";
					else if (normalizedCondition.includes("like")) type = "like_new";
					else if (normalizedCondition.includes("very")) type = "very_good";
					else if (normalizedCondition === "good") type = "good";
					else if (normalizedCondition.includes("accept")) type = "acceptable";

					const labelEl = document.querySelector(`label[for="${inputEl.id}"]`);
					const label =
						labelEl?.querySelector("span:first-child")?.textContent?.trim() ||
						conditionValue;

					conditions.push({
						type,
						label,
						price: conditionPrice,
						available: isAvailable,
						variantId,
						sku: skuAttr,
						stock,
					});
				});

				if (conditions.length === 0) {
					conditions.push({
						type: "unknown",
						label: "Standard",
						price,
						available: true,
						variantId: "",
						sku: null,
						stock: null,
					});
				}

				const addToCartBtn = document.querySelector(
					".product-form__submit, button[name='add']",
				);
				const isDisabled = addToCartBtn?.hasAttribute("disabled");
				const soldOutIndicator = document.querySelector(
					".sold-out, .out-of-stock, [class*='sold-out']",
				);
				const inStock = !isDisabled && !soldOutIndicator;

				const rrpAttr = document
					.querySelector("input[data-rrp]")
					?.getAttribute("data-rrp");
				const rrp = rrpAttr ? parseFloat(rrpAttr) / 100 : null;

				const seriesEl = document.querySelector(
					".series-block a, [class*='series'] a",
				);
				const series = seriesEl?.textContent?.trim() || null;

				const pathParts = window.location.pathname.split("/").filter(Boolean);
				const slug = pathParts[pathParts.length - 1] || "";

				return {
					sourceId,
					title,
					author,
					price,
					currency,
					imageUrl,
					imageUrls,
					url: window.location.href,
					slug,
					description,
					specs,
					conditions,
					inStock,
					rrp,
					series,
				};
			});

			await Dataset.pushData({
				type: RouteLabel.PRODUCT,
				url: request.url,
				data: productDetail,
				scrapedAt: new Date().toISOString(),
			});

			this.logger.log(`Extracted product: ${productDetail.title}`);
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : "Unknown error";
			this.logger.error(`Failed to process product page: ${errorMessage}`);

			if (
				errorMessage.includes("timeout") ||
				errorMessage.includes("Timeout")
			) {
				throw new RequestTimeoutException(
					`Timeout while scraping product: ${request.url}`,
				);
			}

			throw new HttpException(
				`Failed to scrape product: ${errorMessage}`,
				HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}

	private async autoScroll(page: Page): Promise<void> {
		await page.evaluate(async () => {
			await new Promise<void>((resolve) => {
				let totalHeight = 0;
				const distance = 300;
				const maxScrolls = 50;
				let scrollCount = 0;

				const timer = setInterval(() => {
					const scrollHeight = document.body.scrollHeight;
					window.scrollBy(0, distance);
					totalHeight += distance;
					scrollCount++;

					if (totalHeight >= scrollHeight || scrollCount >= maxScrolls) {
						clearInterval(timer);
						window.scrollTo(0, 0);
						resolve();
					}
				}, 150);

				setTimeout(() => {
					clearInterval(timer);
					resolve();
				}, 15000);
			});
		});

		await page.waitForTimeout(1500);
	}

	private async extractPaginationInfo(page: Page): Promise<PaginationInfo> {
		return await page.evaluate(() => {
			const paginationContainer = document.querySelector(
				'.pagination, nav[aria-label="Pagination"], [class*="pagination"]',
			);

			const currentPageEl = paginationContainer?.querySelector(
				'[aria-current="page"], .pagination__item--current, .current',
			);
			const currentPage = parseInt(
				currentPageEl?.textContent?.trim() || "1",
				10,
			);

			const nextLink = paginationContainer?.querySelector(
				'a[rel="next"], .pagination__item--next a, a:has(.icon-arrow-right)',
			);
			let nextPageUrl = nextLink?.getAttribute("href") || null;

			if (nextPageUrl && !nextPageUrl.startsWith("http")) {
				nextPageUrl = `${window.location.origin}${nextPageUrl}`;
			}

			const pageLinks = paginationContainer?.querySelectorAll("a");
			let totalPages: number | null = null;
			if (pageLinks && pageLinks.length > 0) {
				const pageNumbers: number[] = [];
				pageLinks.forEach((link) => {
					const num = parseInt(link.textContent?.trim() || "", 10);
					if (!isNaN(num)) {
						pageNumbers.push(num);
					}
				});
				if (pageNumbers.length > 0) {
					totalPages = Math.max(...pageNumbers);
				}
			}

			return { currentPage, totalPages, nextPageUrl };
		});
	}

	private toAbsoluteUrl(url: string): string {
		if (!url) return "";
		if (url.startsWith("http")) return url;
		if (url.startsWith("//")) return `https:${url}`;
		return `${this.baseUrl}${url.startsWith("/") ? "" : "/"}${url}`;
	}

	/**
	 * FIXED: Corrected regex patterns to properly match robots.txt rules
	 * The original `/[+%2B]/i` was a character class matching any of: +, %, 2, B
	 * This caused almost all URLs to be blocked because they contain '2' or 'b'
	 */
	private isUrlAllowed(url: string): boolean {
		const blockedPatterns = [
			/\/search(?:$|\?|\/)/i, // /search endpoint
			/\/cart(?:$|\?|\/)/i, // /cart endpoint
			/\/checkout(?:$|\?|\/)/i, // /checkout endpoint
			/\/account(?:$|\?|\/)/i, // /account endpoint
			/\/admin(?:$|\?|\/)/i, // /admin endpoint
			/[?&]sort_by=/i, // sort_by query parameter
			/\/collections\/[^?]*\+/, // literal + in collection path
			/\/collections\/[^?]*%2[Bb]/, // URL-encoded + (%2B or %2b) in collection path
			/[?&]filter[^&]*&[^&]*filter/i, // multiple filter params
			/\/recommendations\/products/i, // recommendations endpoint
			/-[a-f0-9]{8}-remote/i, // remote product pattern
		];

		const isBlocked = blockedPatterns.some((pattern) => pattern.test(url));

		if (isBlocked) {
			this.logger.debug(`URL blocked by robots.txt rules: ${url}`);
		}

		return !isBlocked;
	}

	private delay(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	async scrapeCategories(): Promise<ScrapeResult<CategoryData[]>> {
		const url = `${this.localizedBaseUrl}`;

		try {
			const requestQueue = await RequestQueue.open(`categories-${Date.now()}`);
			await requestQueue.addRequest({
				url,
				label: RouteLabel.HOME,
			});

			await this.crawler.run([{ url, label: RouteLabel.HOME }]);

			const dataset = await Dataset.open();
			const { items } = await dataset.getData();

			const homeData = items.find(
				(item) => (item as Record<string, unknown>).type === RouteLabel.HOME,
			) as Record<string, unknown> | undefined;

			await dataset.drop();
			await requestQueue.drop();

			const data = (homeData?.data as CategoryData[]) || [];

			return {
				success: true,
				data,
				error: null,
				scrapedAt: new Date(),
				url,
			};
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : "Unknown error";
			this.logger.error(`Failed to scrape categories: ${errorMessage}`);

			return {
				success: false,
				data: null,
				error: errorMessage,
				scrapedAt: new Date(),
				url,
			};
		}
	}

	async scrapeCategory(
		categorySlug: string,
		options?: ScrapeOptions,
	): Promise<ScrapeResult<ProductListItem[]>> {
		let url = `${this.localizedBaseUrl}/collections/${categorySlug}`;

		if (options?.page && options.page > 1) {
			url += `?page=${options.page}`;
		}

		if (!this.isUrlAllowed(url)) {
			return {
				success: false,
				data: null,
				error: "URL blocked by robots.txt rules",
				scrapedAt: new Date(),
				url,
			};
		}

		try {
			const requestQueue = await RequestQueue.open(`category-${Date.now()}`);
			await requestQueue.addRequest({
				url,
				label: RouteLabel.CATEGORY,
			});

			await this.crawler.run([{ url, label: RouteLabel.CATEGORY }]);

			const dataset = await Dataset.open();
			const { items } = await dataset.getData();

			const categoryData = items.find(
				(item) =>
					(item as Record<string, unknown>).type === RouteLabel.CATEGORY,
			) as Record<string, unknown> | undefined;

			await dataset.drop();
			await requestQueue.drop();

			return {
				success: true,
				data: (categoryData?.data as ProductListItem[]) || [],
				error: null,
				scrapedAt: new Date(),
				url,
			};
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : "Unknown error";
			this.logger.error(
				`Failed to scrape category ${categorySlug}: ${errorMessage}`,
			);

			if (
				error instanceof RequestTimeoutException ||
				error instanceof ServiceUnavailableException
			) {
				throw error;
			}

			return {
				success: false,
				data: null,
				error: errorMessage,
				scrapedAt: new Date(),
				url,
			};
		}
	}

	async scrapeProduct(
		productSlug: string,
	): Promise<ScrapeResult<ProductDetail>> {
		const url = `${this.localizedBaseUrl}/products/${productSlug}`;

		if (!this.isUrlAllowed(url)) {
			return {
				success: false,
				data: null,
				error: "URL blocked by robots.txt rules",
				scrapedAt: new Date(),
				url,
			};
		}

		try {
			const requestQueue = await RequestQueue.open(`product-${Date.now()}`);
			await requestQueue.addRequest({
				url,
				label: RouteLabel.PRODUCT,
			});

			await this.crawler.run([{ url, label: RouteLabel.PRODUCT }]);

			const dataset = await Dataset.open();
			const { items } = await dataset.getData();

			const productData = items.find(
				(item) => (item as Record<string, unknown>).type === RouteLabel.PRODUCT,
			) as Record<string, unknown> | undefined;

			await dataset.drop();
			await requestQueue.drop();

			return {
				success: true,
				data: (productData?.data as ProductDetail) || null,
				error: null,
				scrapedAt: new Date(),
				url,
			};
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : "Unknown error";
			this.logger.error(
				`Failed to scrape product ${productSlug}: ${errorMessage}`,
			);

			if (
				error instanceof RequestTimeoutException ||
				error instanceof ServiceUnavailableException
			) {
				throw error;
			}

			return {
				success: false,
				data: null,
				error: errorMessage,
				scrapedAt: new Date(),
				url,
			};
		}
	}

	async scrapeProducts(
		productSlugs: string[],
		options?: BatchScrapeOptions,
	): Promise<Map<string, ScrapeResult<ProductDetail>>> {
		const batchSize = options?.batchSize || 3;
		const delayMs = options?.delayMs || 5000;

		const results = new Map<string, ScrapeResult<ProductDetail>>();

		for (let i = 0; i < productSlugs.length; i += batchSize) {
			const batch = productSlugs.slice(i, i + batchSize);

			this.logger.log(
				`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(productSlugs.length / batchSize)}`,
			);

			for (const slug of batch) {
				try {
					const result = await this.scrapeProduct(slug);
					results.set(slug, result);
				} catch (error) {
					results.set(slug, {
						success: false,
						data: null,
						error: error instanceof Error ? error.message : "Unknown error",
						scrapedAt: new Date(),
						url: `${this.localizedBaseUrl}/products/${slug}`,
					});
				}

				if (i + batch.indexOf(slug) < productSlugs.length - 1) {
					await this.delay(delayMs + Math.random() * 2000);
				}
			}

			if (i + batchSize < productSlugs.length) {
				await this.delay(delayMs * 2);
			}
		}

		return results;
	}

	async healthCheck(): Promise<{ healthy: boolean; message: string }> {
		try {
			const result = await this.scrapeCategories();
			return {
				healthy: result.success && (result.data?.length || 0) > 0,
				message: result.success
					? `Connected successfully. Found ${result.data?.length} categories.`
					: `Connection failed: ${result.error}`,
			};
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : "Unknown error";
			return {
				healthy: false,
				message: `Health check failed: ${errorMessage}`,
			};
		}
	}

	getAbsoluteUrl(relativeUrl: string): string {
		return this.toAbsoluteUrl(relativeUrl);
	}
}
