import { useState } from "react";
import { useRoute, Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PostCard } from "@/components/post-card";
import {
  useGetPost,
  getGetPostQueryKey,
  useListReplies,
  useCreateReply,
  getListRepliesQueryKey,
} from "@workspace/api-client-react";

export default function PostDetail() {
  const [, params] = useRoute("/post/:id");
  const postId = Number(params?.id);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: post, isLoading: postLoading } = useGetPost(postId, {
    query: { queryKey: getGetPostQueryKey(postId), enabled: !!postId }
  });

  const { data: replies = [], isLoading: repliesLoading } = useListReplies(postId, {
    query: { queryKey: getListRepliesQueryKey(postId), enabled: !!postId }
  });

  const createReply = useCreateReply();
  const [replyContent, setReplyContent] = useState("");

  const handleSubmitReply = () => {
    if (!replyContent.trim()) return;

    createReply.mutate(
      { id: postId, data: { content: replyContent } },
      {
        onSuccess: () => {
          setReplyContent("");
          queryClient.invalidateQueries({ queryKey: getListRepliesQueryKey(postId) });
          toast.success("Thought added.");
        },
        onError: () => {
          toast.error("Failed to add thought. Please try again.");
        }
      }
    );
  };

  if (postLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 animate-in fade-in">
        <div className="text-muted-foreground font-serif italic mb-6">Loading...</div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-muted-foreground font-serif italic">Post not found.</div>
        <Link href="/feed" className="text-primary mt-4 inline-block hover:underline">
          Return to feed
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 pb-32 animate-in fade-in duration-500">
      <Link
        href="/feed"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 font-serif italic"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Link>

      <div className="border border-border/50 rounded-lg overflow-hidden bg-card/30 mb-8">
        <PostCard post={post} />
      </div>

      <div className="pl-6 sm:pl-12 border-l border-border/30 space-y-6">
        {repliesLoading ? (
          <div className="text-muted-foreground font-serif italic text-sm py-4">Loading thoughts...</div>
        ) : replies.length === 0 ? (
          <div className="text-muted-foreground font-serif italic text-sm py-4 opacity-70">
            No replies yet. Be the first.
          </div>
        ) : (
          replies.map((reply) => (
            <article key={reply.id} className="animate-in fade-in">
              <div className="flex items-center gap-2 mb-2">
                <Link href={`/u/${reply.authorUsername}`}>
                  <div className="font-serif text-sm font-medium text-foreground hover:underline underline-offset-4 decoration-primary/30 cursor-pointer">
                    {reply.authorDisplayName || reply.authorUsername}
                  </div>
                </Link>
                <div className="text-xs text-muted-foreground font-sans">
                  @{reply.authorUsername}
                </div>
                <span className="text-muted-foreground/30 text-xs">•</span>
                <time className="text-xs text-muted-foreground italic">
                  {formatDistanceToNow(new Date(reply.createdAt))}
                </time>
              </div>
              <div className="text-foreground whitespace-pre-wrap font-serif text-base leading-relaxed text-pretty">
                {reply.content}
              </div>
            </article>
          ))
        )}

        {user && (
          <div className="pt-8 mt-8 border-t border-border/30">
            <Textarea
              placeholder="Leave a thought..."
              className="min-h-[100px] resize-none bg-background/50 border-border/50 font-serif text-base focus-visible:ring-primary/20 placeholder:italic placeholder:opacity-50"
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              disabled={createReply.isPending}
            />
            <div className="flex justify-end mt-3">
              <Button
                variant="outline"
                className="font-serif italic text-sm rounded-full text-muted-foreground hover:text-foreground transition-colors border-border/50"
                onClick={handleSubmitReply}
                disabled={!replyContent.trim() || createReply.isPending}
              >
                {createReply.isPending ? "Adding..." : "Leave a thought"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
