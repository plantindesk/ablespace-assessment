import { ExternalLink } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { formatPrice, truncate } from "@/lib/utils";
import type { ProductSummary } from "@/types";

interface ProductCardProps {
  product: ProductSummary;
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Card className="h-full flex flex-col overflow-hidden group">
      {/* Image */}
      <div className="relative aspect-3/4 bg-muted overflow-hidden">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <span className="text-4xl">📚</span>
          </div>
        )}
      </div>

      {/* Content */}
      <CardContent className="flex-1 p-4 space-y-2">
        <h3 className="font-medium leading-tight line-clamp-2 group-hover:text-primary transition-colors">
          {truncate(product.title, 60)}
        </h3>
        {product.author && (
          <p className="text-sm text-muted-foreground line-clamp-1">
            by {product.author}
          </p>
        )}
        <Badge variant="outline" className="mt-2">
          {formatPrice(product.price, product.currency)}
        </Badge>
      </CardContent>

      {/* Footer */}
      <CardFooter className="p-4 pt-0 flex gap-2">
        <Button asChild variant="default" size="sm" className="flex-1">
          <Link href={`/product/${product.slug}`}>View Details</Link>
        </Button>
        <Button asChild variant="outline" size="icon" className="shrink-0">
          <a
            href={product.url}
            target="_blank"
            rel="noopener noreferrer"
            title="View on World of Books"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
}
