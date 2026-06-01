import { useGetFeed, getGetFeedQueryKey } from "@workspace/api-client-react";
import { PostCard } from "@/components/post-card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { PenSquare } from "lucide-react";
import { Link } from "wouter";

export default function Feed() {
  const [cursor, setCursor] = useState<string | null>(null);
  const { data, isLoading, isError } = useGetFeed({ cursor });

  return (
    <div className="flex flex-col min-h-[100dvh]">
      <header className="p-6 border-b border-border/50 sticky top-0 bg-background/95 backdrop-blur-sm z-10 flex justify-between items-center">
        <h2 className="font-serif text-2xl tracking-tight text-foreground">Home</h2>
        <Button variant="ghost" size="icon" asChild className="md:hidden text-primary">
          <Link href="/post/new">
            <PenSquare size={20} />
          </Link>
        </Button>
      </header>
      
      <div className="flex-1 flex flex-col">
        {isLoading && (
          <div className="p-8 text-center text-muted-foreground font-serif italic">
            Gathering thoughts...
          </div>
        )}
        
        {isError && (
          <div className="p-8 text-center text-destructive font-serif">
            Something went wrong retrieving the feed.
          </div>
        )}
        
        {data && data.posts.length === 0 && (
          <div className="p-12 text-center flex flex-col items-center justify-center h-64">
            <p className="text-lg text-muted-foreground font-serif italic mb-6">
              It is quiet here. Too quiet.
            </p>
            <Button variant="outline" asChild className="font-sans font-medium text-foreground">
              <Link href="/explore">Explore and find people</Link>
            </Button>
          </div>
        )}
        
        {data && data.posts.length > 0 && (
          <div className="flex flex-col">
            {data.posts.map(post => (
              <PostCard key={post.id} post={post} queryToInvalidate={getGetFeedQueryKey()} />
            ))}
            
            {data.nextCursor && (
              <div className="p-8 flex justify-center">
                <Button 
                  variant="outline" 
                  onClick={() => setCursor(data.nextCursor)}
                  className="font-serif shadow-none border-border"
                >
                  Read further back
                </Button>
              </div>
            )}
            
            {!data.nextCursor && data.posts.length > 0 && (
              <div className="p-12 text-center text-muted-foreground font-serif italic text-sm">
                You have reached the end.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
