"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SearchBarProps {
  defaultValue?: string;
  placeholder?: string;
  className?: string;
}

export function SearchBar({
  defaultValue = "",
  placeholder = "Search books...",
  className,
}: SearchBarProps) {
  const [query, setQuery] = useState(defaultValue);
  const router = useRouter();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmedQuery = query.trim();

    if (trimmedQuery.length >= 2) {
      router.push(`/search?q=${encodeURIComponent(trimmedQuery)}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div className="relative flex items-center">
        <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 pr-20 w-full md:w-80"
        />
        <Button
          type="submit"
          size="sm"
          className="absolute right-1"
          disabled={query.trim().length < 2}
        >
          Search
        </Button>
      </div>
    </form>
  );
}
