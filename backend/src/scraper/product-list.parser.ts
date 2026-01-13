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

export function parseProductListHtml(html: string): ProductListItem[] {
  const $ = cheerio.load(html);
  const products: ProductListItem[] = [];

  $("li.ais-InfiniteHits-item").each((_, element) => {
    const $item = $(element);
    const product = extractProduct($item);

    if (product) {
      products.push(product);
    }
  });

  console.log(`Parsed ${products.length} products from HTML`);

  return products;
}

function extractProduct(
  $item: cheerio.Cheerio<Element>,
): ProductListItem | null {
  const $card = $item.find(".card[data-product-id]");
  if ($card.length === 0) {
    return null;
  }

  const $productLink = $item.find(
    "a.product-card[data-item_id], a.full-unstyled-link[data-item_id]",
  );

  const sourceId =
    $productLink.attr("data-item_id") || $card.attr("data-product-id") || "";

  const title =
    $productLink.attr("data-item_name") ||
    $productLink.text().trim() ||
    $item.find(".card__heading").text().trim() ||
    "";

  const href = $productLink.attr("href") || "";
  const url = toAbsoluteUrl(href);
  const slug = extractSlug(href);

  const authorText = $item.find("p.author, .author").first().text().trim();
  const author = authorText || null;

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

  const $img = $item.find(".card__inner img");
  const imgSrc = $img.attr("src") || null;
  const imageUrl = imgSrc ? toAbsoluteUrl(imgSrc) : null;

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
  const cleanPath = urlOrPath.split("?")[0].split("#")[0];
  const pathParts = cleanPath.split("/").filter(Boolean);
  return pathParts[pathParts.length - 1] || "";
}
