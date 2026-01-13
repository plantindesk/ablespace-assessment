import { CategoryCard } from "@/components/CategoryCard";
import { api } from "@/lib/api";

export const revalidate = 300; // Revalidate every 5 minutes

export default async function HomePage() {
  const response = await api.getCategories();
  const categories = response.data;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <section className="text-center py-12 space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
          Explore World of Books
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Discover millions of second-hand books across all categories. Quality
          reads at affordable prices.
        </p>
      </section>

      {/* Categories Grid */}
      <section className="py-8">
        <h2 className="text-2xl font-semibold mb-6">Browse by Category</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {categories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>

        {categories.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No categories found. The catalog may be syncing.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
