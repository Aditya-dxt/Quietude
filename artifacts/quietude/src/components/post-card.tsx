import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import type { Post } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Trash2, Globe, Users, Lock } from "lucide-react";
import { useDeletePost, getGetFeedQueryKey, getGetExploreFeedQueryKey, getListUserPostsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Button } from "./ui/button";

export function PostCard({ post, queryToInvalidate }: { post: Post, queryToInvalidate?: readonly unknown[] }) {
  const { user } = useAuth();
  const isOwn = user?.username === post.authorUsername;
  const deleteMutation = useDeletePost();
  const queryClient = useQueryClient();
  const [isRevealed, setIsRevealed] = useState(!post.isSensitive);

  const toggleReveal = () => {
    if (post.isSensitive && !isRevealed) {
      setIsRevealed(true);
    }
  };

  const handleDelete = () => {
    deleteMutation.mutate({ id: post.id }, {
      onSuccess: () => {
        toast.success("Post removed.");
        // Invalidate common feed queries to remove the post
        if (queryToInvalidate) {
           queryClient.invalidateQueries({ queryKey: queryToInvalidate });
        } else {
           queryClient.invalidateQueries({ queryKey: getGetFeedQueryKey() });
           queryClient.invalidateQueries({ queryKey: getGetExploreFeedQueryKey() });
           queryClient.invalidateQueries({ queryKey: getListUserPostsQueryKey(post.authorUsername) });
        }
      }
    });
  };

  const displayName = post.authorDisplayName || post.authorUsername;

  return (
    <article className="p-6 border-b border-border/50 hover:bg-card/50 transition-colors animate-in fade-in duration-500">
      <div className="flex justify-between items-start mb-3">
        <Link href={`/u/${post.authorUsername}`}>
          <div className="group flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground font-serif text-lg">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="font-serif font-medium text-foreground group-hover:underline underline-offset-4 decoration-primary/30">
                {displayName}
              </div>
              <div className="text-sm text-muted-foreground font-sans">
                @{post.authorUsername}
              </div>
            </div>
          </div>
        </Link>
        <div className="flex items-center gap-3">
          <time className="text-xs text-muted-foreground whitespace-nowrap flex items-center gap-1.5">
            {formatDistanceToNow(new Date(post.createdAt))} ago
            {/* @ts-ignore - visibility might not be fully typed everywhere yet */}
            {(post as any).visibility === "public" && <Globe size={12} className="opacity-50" />}
            {(post as any).visibility === "followers" && <Users size={12} className="opacity-50" />}
            {(post as any).visibility === "private" && <Lock size={12} className="opacity-50" />}
          </time>
          {isOwn && (
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={handleDelete}>
              <Trash2 size={16} />
            </Button>
          )}
        </div>
      </div>
      
      <div 
        className={`pl-13 mt-3 relative ${post.isSensitive && !isRevealed ? "cursor-pointer" : ""}`}
        onClick={post.isSensitive && !isRevealed ? toggleReveal : undefined}
      >
        <div className={`transition-all duration-300 ${post.isSensitive && !isRevealed ? "filter blur-md select-none" : ""}`}>
          <div className="text-foreground whitespace-pre-wrap font-serif text-lg leading-relaxed text-pretty">
            {post.content}
          </div>
          {post.imageUrl && (
            <div className="mt-3 overflow-hidden rounded-xl">
              <img src={post.imageUrl} alt="Post image" className="max-h-[400px] w-auto object-cover" loading="lazy" />
            </div>
          )}
        </div>
        
        {post.isSensitive && !isRevealed && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/5 z-10 rounded-xl">
            <div className="bg-background/80 backdrop-blur-md px-4 py-2 rounded-full border border-border shadow-sm flex flex-col items-center text-center">
               <span className="font-medium text-sm text-foreground">
                 {post.contentWarning ? `Sensitive Content: ${post.contentWarning}` : "Sensitive Content"}
               </span>
               <span className="text-xs text-muted-foreground mt-0.5">Tap to view</span>
            </div>
          </div>
        )}
      </div>
      
      {!post.isPermanent && post.expiresAt && (
        <div className="pl-13 mt-4 flex items-center">
           <span className="text-xs text-muted-foreground italic opacity-70">
             Drifts away in {formatDistanceToNow(new Date(post.expiresAt))}
           </span>
        </div>
      )}
      
      <div className="pl-13 mt-4 flex items-center justify-end">
        <Link href={`/post/${post.id}`} className="text-xs text-muted-foreground italic hover:text-foreground transition-colors">
          Read thread →
        </Link>
      </div>
    </article>
  );
}
