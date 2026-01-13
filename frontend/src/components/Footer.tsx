import { BookOpen, ExternalLink } from "lucide-react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div className="space-y-3">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <BookOpen className="h-5 w-5 text-primary" />
              <span>World of Books Explorer</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Explore millions of second-hand books from World of Books.
            </p>
          </div>

          {/* Links */}
          <div className="space-y-3">
            <h4 className="font-medium">Quick Links</h4>
            <nav className="flex flex-col gap-2">
              <Link
                href="/"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                All Categories
              </Link>
              <Link
                href="/search"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Search Books
              </Link>
            </nav>
          </div>

          {/* External */}
          <div className="space-y-3">
            <h4 className="font-medium">World of Books</h4>
            <a
              href="https://www.worldofbooks.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Visit Official Site
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        <div className="mt-8 pt-4 border-t text-center text-sm text-muted-foreground">
          <p>
            This is an unofficial product explorer. All book data belongs to{" "}
            <a
              href="https://www.worldofbooks.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-primary"
            >
              World of Books
            </a>
            .
          </p>
        </div>
      </div>
    </footer>
  );
}
