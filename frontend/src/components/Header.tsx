import { BookOpen, Menu } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SearchBar } from "./SearchBar";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold text-xl hover:opacity-80 transition-opacity"
        >
          <BookOpen className="h-6 w-6 text-primary" />
          <span className="hidden sm:inline">World of Books</span>
          <span className="sm:hidden">WoB</span>
        </Link>

        {/* Navigation - Desktop */}
        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="/"
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            Categories
          </Link>
          <Link
            href="/search"
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            Browse
          </Link>
        </nav>

        {/* Search Bar */}
        <div className="hidden md:block">
          <SearchBar />
        </div>

        {/* Mobile Menu Button */}
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </div>

      {/* Mobile Search - Below header */}
      <div className="md:hidden border-t px-4 py-2">
        <SearchBar className="w-full" />
      </div>
    </header>
  );
}
