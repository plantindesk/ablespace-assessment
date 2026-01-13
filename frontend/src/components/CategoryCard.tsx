import { Clock, FolderOpen } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getRelativeTime } from "@/lib/utils";
import type { Category } from "@/types";

interface CategoryCardProps {
  category: Category;
}

export function CategoryCard({ category }: CategoryCardProps) {
  return (
    <Link href={`/category/${category.slug}`}>
      <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer group">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <FolderOpen className="h-5 w-5" />
            </div>
            <Badge variant="secondary">{category.productCount} books</Badge>
          </div>
          <CardTitle className="mt-4 group-hover:text-primary transition-colors">
            {category.title}
          </CardTitle>
          <CardDescription className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>Updated {getRelativeTime(category.lastScrapedAt)}</span>
          </CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );
}
