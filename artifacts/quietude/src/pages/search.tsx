import { useState, useEffect } from "react";
import { Link } from "wouter";
import { getSearchUsersQueryOptions } from "@workspace/api-client-react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const { data: users, isLoading } = useQuery({
    ...getSearchUsersQueryOptions({ q: debouncedQuery }),
    enabled: debouncedQuery.length >= 2,
  });

  return (
    <div className="flex flex-col min-h-[100dvh]">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border/50 p-4">
        <h1 className="font-serif text-2xl font-semibold mb-4">Search</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or @username..."
            className="pl-10"
          />
        </div>
      </header>

      <div className="flex-1 p-4 flex flex-col gap-4">
        {debouncedQuery.length < 2 ? (
          <div className="text-center text-muted-foreground mt-8 font-serif italic">
            Enter at least 2 characters to search.
          </div>
        ) : isLoading ? (
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-12 h-12 bg-muted rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/3" />
                  <div className="h-3 bg-muted rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : users?.length === 0 ? (
          <div className="text-center text-muted-foreground mt-8 font-serif italic">
            No one found. Try a different name.
          </div>
        ) : (
          users?.map((user) => (
            <Link key={user.id} href={`/u/${user.username}`}>
              <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-accent/50 transition-colors cursor-pointer border border-transparent hover:border-border/50">
                <Avatar className="w-12 h-12">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {(user.displayName || user.username).substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">
                    {user.displayName || user.username}
                  </div>
                  <div className="text-sm text-muted-foreground truncate">
                    @{user.username}
                  </div>
                  {user.bio && (
                    <p className="text-sm mt-1 line-clamp-2 break-words">
                      {user.bio}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
