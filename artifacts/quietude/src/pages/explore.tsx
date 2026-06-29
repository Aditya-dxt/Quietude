import { useGetExploreFeed, getGetExploreFeedQueryKey } from "@workspace/api-client-react";
import { PostCard } from "@/components/post-card";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";

export default function Explore() {
  const [cursor, setCursor] = useState<string | null>(null);
  const { data, isLoading, isError } = useGetExploreFeed({ cursor });

  const mutedWords = useMemo<string[]>(() => {
    try {
      const stored = localStorage.getItem("quietude_muted_words");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }, []);

  const filteredPosts = useMemo(() => {
    if (!data) return [];
    if (mutedWords.length === 0) return data.posts;
    return data.posts.filter(post => {
      const content = post.content.toLowerCase();
      return !mutedWords.some(word => content.includes(word));
    });
  }, [data, mutedWords]);

  const hiddenCount = data ? data.posts.length - filteredPosts.length : 0;

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
            {hiddenCount > 0 && (
              <div className="p-3 text-center text-xs text-muted-foreground/70 bg-secondary/20 border-b border-border/30">
                {hiddenCount} post{hiddenCount > 1 ? 's' : ''} hidden by your muted words.
              </div>
            )}
            {filteredPosts.map(post => (
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
