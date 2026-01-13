import * as cheerio from "cheerio";
import { Element } from "domhandler";

interface ProductListItem {
  sourceId: string;
  title: string;
  author: string | null;
  price: number;
  currency: string;
  imageUrl: string | null;
  url: string;
  slug: string;
}

const BASE_URL = "https://www.worldofbooks.com";

/**
 * Parses World of Books category page HTML for product listings.
 * Designed for Algolia InstantSearch powered pages.
 */
export function parseProductListHtml(html: string): ProductListItem[] {
  const $ = cheerio.load(html);
  const products: ProductListItem[] = [];

  // Primary selector based on actual HTML structure
  // Each product is in: li.ais-InfiniteHits-item > .main-product-card > .card[data-product-id]
  $("li.ais-InfiniteHits-item").each((_, element) => {
    const $item = $(element);
    const product = extractProduct($item);

    if (product) {
      products.push(product);
    }
  });

  // Log extraction result
  console.log(`Parsed ${products.length} products from HTML`);

  return products;
}

function extractProduct(
  $item: cheerio.Cheerio<Element>,
): ProductListItem | null {
  // Find the card with product ID
  const $card = $item.find(".card[data-product-id]");
  if ($card.length === 0) {
    return null;
  }

  // Find the product link - contains most data attributes
  const $productLink = $item.find(
    "a.product-card[data-item_id], a.full-unstyled-link[data-item_id]",
  );

  // === SOURCE ID ===
  // Prefer data-item_id from link (more reliable), fallback to card's data-product-id
  const sourceId =
    $productLink.attr("data-item_id") || $card.attr("data-product-id") || "";

  // === TITLE ===
  // From data attribute (cleanest) or link text
  const title =
    $productLink.attr("data-item_name") ||
    $productLink.text().trim() ||
    $item.find(".card__heading").text().trim() ||
    "";

  // === URL ===
  const href = $productLink.attr("href") || "";
  const url = toAbsoluteUrl(href);
  const slug = extractSlug(href);

  // === AUTHOR ===
  const authorText = $item.find("p.author, .author").first().text().trim();
  const author = authorText || null;

  // === PRICE ===
  // Prefer data-price attribute (numeric, no currency symbol)
  const dataPrice = $productLink.attr("data-price");
  let price = 0;
  let currency = "GBP";

  if (dataPrice) {
    price = parseFloat(dataPrice) || 0;
  } else {
    const priceText = $item.find(".price-item").first().text().trim();
    const parsed = parsePrice(priceText);
    price = parsed.price;
    currency = parsed.currency;
  }

  // === IMAGE ===
  const $img = $item.find(".card__inner img");
  const imgSrc = $img.attr("src") || null;
  const imageUrl = imgSrc ? toAbsoluteUrl(imgSrc) : null;

  // === VALIDATION ===
  if (!title || !url || !slug) {
    return null;
  }

  return {
    sourceId,
    title,
    author,
    price,
    currency,
    imageUrl,
    url,
    slug,
  };
}

function parsePrice(priceText: string): { price: number; currency: string } {
  let price = 0;
  let currency = "GBP";

  if (!priceText) {
    return { price, currency };
  }

  if (priceText.includes("$")) currency = "USD";
  else if (priceText.includes("€")) currency = "EUR";
  else if (priceText.includes("£")) currency = "GBP";

  const match = priceText.match(/[\d]+(?:\.[\d]+)?/);
  if (match) {
    price = parseFloat(match[0]);
  }

  return { price, currency };
}

function toAbsoluteUrl(url: string): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("//")) return `https:${url}`;
  const path = url.startsWith("/") ? url : `/${url}`;
  return `${BASE_URL}${path}`;
}

function extractSlug(urlOrPath: string): string {
  // Remove query string and hash
  const cleanPath = urlOrPath.split("?")[0].split("#")[0];
  const pathParts = cleanPath.split("/").filter(Boolean);
  return pathParts[pathParts.length - 1] || "";
}
