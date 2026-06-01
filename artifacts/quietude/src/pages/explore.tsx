import { useGetExploreFeed, getGetExploreFeedQueryKey } from "@workspace/api-client-react";
import { PostCard } from "@/components/post-card";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function Explore() {
  const [cursor, setCursor] = useState<string | null>(null);
  const { data, isLoading, isError } = useGetExploreFeed({ cursor });

  return (
    <div className="flex flex-col min-h-[100dvh]">
      <header className="p-6 border-b border-border/50 sticky top-0 bg-background/95 backdrop-blur-sm z-10">
        <h2 className="font-serif text-2xl tracking-tight text-foreground">Explore</h2>
        <p className="text-sm text-muted-foreground mt-1">Discover thoughts from the quietude network.</p>
      </header>
      
      <div className="flex-1 flex flex-col">
        {isLoading && (
          <div className="p-8 text-center text-muted-foreground font-serif italic">
            Wandering the network...
          </div>
        )}
        
        {isError && (
          <div className="p-8 text-center text-destructive font-serif">
            Something went wrong retrieving the explore feed.
          </div>
        )}
        
        {data && data.posts.length === 0 && (
          <div className="p-12 text-center text-muted-foreground font-serif italic">
            The network is empty.
          </div>
        )}
        
        {data && data.posts.length > 0 && (
          <div className="flex flex-col">
            {data.posts.map(post => (
              <PostCard key={post.id} post={post} queryToInvalidate={getGetExploreFeedQueryKey()} />
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
