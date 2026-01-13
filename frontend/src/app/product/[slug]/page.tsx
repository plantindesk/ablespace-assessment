import { api } from "@/lib/api";
import { ProductClient } from "./client";

export async function generateStaticParams() {
  const categories = await api.getCategories();
  const allProducts: string[] = [];

  for (const category of categories.data) {
    const categoryResponse = await api.getCategory(category.slug, 1, 100);
    const products = categoryResponse.data.products.items;
    allProducts.push(...products.map((p) => p.slug));
  }

  return allProducts.map((slug) => ({ slug }));
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <ProductClient slug={slug} />;
}
