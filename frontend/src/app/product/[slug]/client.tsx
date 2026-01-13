"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import DOMPurify from "dompurify";
import {
  Check,
  ChevronLeft,
  Clock,
  ExternalLink,
  Loader2,
  RefreshCw,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProduct } from "@/hooks/use-product";
import { api } from "@/lib/api";
import { formatPrice, getRelativeTime } from "@/lib/utils";

interface ProductClientProps {
  slug: string;
}

export function ProductClient({ slug }: ProductClientProps) {
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error, isFetching } = useProduct(slug);

  const refreshMutation = useMutation({
    mutationFn: () => api.refreshProduct(slug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product", slug] });
    },
  });

  if (isLoading) {
    return <ProductPageSkeleton />;
  }

  if (isError) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-md mx-auto space-y-4">
          <h1 className="text-2xl font-bold">Product Not Found</h1>
          <p className="text-muted-foreground">
            {error instanceof Error ? error.message : "Failed to load product"}
          </p>
          <Button asChild>
            <Link href="/">
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Categories
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const product = data!.data;
  const detail = product.detail;

  return (
    <div className="container mx-auto px-4 py-8">
      <nav className="mb-6">
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Categories
        </Link>
      </nav>

      {isFetching && !isLoading && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
          <span className="text-sm text-blue-700">
            Live checking stock and pricing...
          </span>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
        <div className="space-y-4">
          <div className="relative aspect-3/4 bg-muted rounded-lg overflow-hidden">
            {product.imageUrl ? (
              <Image
                src={product.imageUrl}
                alt={product.title}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <span className="text-8xl">📚</span>
              </div>
            )}
          </div>

          {product.imageUrls.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {product.imageUrls.slice(0, 4).map((url, idx) => (
                <div
                  key={idx}
                  className="relative aspect-square bg-muted rounded-md overflow-hidden"
                >
                  <Image
                    src={url}
                    alt={`${product.title} - Image ${idx + 1}`}
                    fill
                    className="object-cover"
                    sizes="100px"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold leading-tight">
              {product.title}
            </h1>
            {product.author && (
              <p className="mt-2 text-lg text-muted-foreground">
                by {product.author}
              </p>
            )}
          </div>

          <div className="flex items-center gap-4">
            <span className="text-3xl font-bold text-primary">
              {formatPrice(product.price, product.currency)}
            </span>
            {detail && (
              <Badge variant={detail.inStock ? "secondary" : "destructive"}>
                {detail.inStock ? (
                  <>
                    <Check className="h-3 w-3 mr-1" />
                    In Stock
                  </>
                ) : (
                  <>
                    <X className="h-3 w-3 mr-1" />
                    Out of Stock
                  </>
                )}
              </Badge>
            )}
          </div>

          {detail && detail.conditions.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Available Conditions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {detail.conditions.map((condition, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-between p-3 rounded-lg border ${condition.available
                        ? "bg-green-50 border-green-200"
                        : "bg-gray-50 border-gray-200 opacity-60"
                      }`}
                  >
                    <span className="font-medium">{condition.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">
                        {formatPrice(condition.price, product.currency)}
                      </span>
                      {condition.available ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <X className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <div className="flex gap-3">
            <Button asChild size="lg" className="flex-1">
              <a href={product.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Buy at World of Books
              </a>
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => refreshMutation.mutate()}
              disabled={refreshMutation.isPending}
            >
              <RefreshCw
                className={`h-4 w-4 ${refreshMutation.isPending ? "animate-spin" : ""}`}
              />
            </Button>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Data updated {getRelativeTime(product.lastScrapedAt)}</span>
          </div>

          {detail && Object.keys(detail.specs).length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Specifications</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-2 gap-2 text-sm">
                  {Object.entries(detail.specs).map(([key, value]) => (
                    <div key={key} className="contents">
                      <dt className="text-muted-foreground">{key}</dt>
                      <dd className="font-medium">{value}</dd>
                    </div>
                  ))}
                </dl>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {detail?.description && (
        <section className="mt-12">
          <h2 className="text-2xl font-bold mb-4">Description</h2>
          <Card>
            <CardContent className="pt-6">
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(detail.description),
                }}
              />
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}

function ProductPageSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="h-5 w-32 bg-muted animate-pulse rounded mb-6" />

      <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
        <div>
          <div className="aspect-3/4 bg-muted animate-pulse rounded-lg" />
          <div className="grid grid-cols-4 gap-2 mt-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="aspect-square bg-muted animate-pulse rounded-md"
              />
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <div className="h-10 w-3/4 bg-muted animate-pulse rounded" />
            <div className="h-6 w-1/2 bg-muted animate-pulse rounded" />
          </div>

          <div className="flex items-center gap-4">
            <div className="h-10 w-24 bg-muted animate-pulse rounded" />
            <div className="h-6 w-20 bg-muted animate-pulse rounded" />
          </div>

          <div className="h-40 w-full bg-muted animate-pulse rounded-lg" />

          <div className="h-12 w-full bg-muted animate-pulse rounded" />

          <div className="h-32 w-full bg-muted animate-pulse rounded-lg" />
        </div>
      </div>
    </div>
  );
}
