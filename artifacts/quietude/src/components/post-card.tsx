import { formatDistanceToNow } from "date-fns";
import type { Post } from "@workspace/api-client-react/src/generated/api.schemas";
import { Link } from "wouter";
import { Trash2 } from "lucide-react";
import { useDeletePost, getGetFeedQueryKey, getGetExploreFeedQueryKey, getListUserPostsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Button } from "./ui/button";

export function PostCard({ post, queryToInvalidate }: { post: Post, queryToInvalidate?: any[] }) {
  const { user } = useAuth();
  const isOwn = user?.username === post.authorUsername;
  const deleteMutation = useDeletePost();
  const queryClient = useQueryClient();

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
          <time className="text-xs text-muted-foreground whitespace-nowrap">
            {formatDistanceToNow(new Date(post.createdAt))} ago
          </time>
          {isOwn && (
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={handleDelete}>
              <Trash2 size={16} />
            </Button>
          )}
        </div>
      </div>
      
      <div className="pl-13 text-foreground whitespace-pre-wrap font-serif text-lg leading-relaxed text-pretty">
        {post.content}
      </div>
      
      {!post.isPermanent && post.expiresAt && (
        <div className="pl-13 mt-4 flex items-center">
           <span className="text-xs text-muted-foreground italic opacity-70">
             Drifts away in {formatDistanceToNow(new Date(post.expiresAt))}
           </span>
        </div>
      )}
    </article>
  );
}
