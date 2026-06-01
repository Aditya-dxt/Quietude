import { useGetUserProfile, useListUserPosts, useFollowUser, useUnfollowUser, getGetUserProfileQueryKey, getGetFeedQueryKey, getGetFollowingQueryKey } from "@workspace/api-client-react";
import { PostCard } from "@/components/post-card";
import { Button } from "@/components/ui/button";
import { useParams } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { UserPlus, UserMinus, MessageSquare } from "lucide-react";
import { Link } from "wouter";

export default function Profile() {
  const { handle } = useParams<{ handle: string }>();
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  
  const { data: profile, isLoading: profileLoading, isError: profileError } = useGetUserProfile(handle || "", { 
    query: { enabled: !!handle } 
  });
  
  const { data: postsData, isLoading: postsLoading } = useListUserPosts(handle || "", { 
    query: { enabled: !!handle } 
  });

  const followMutation = useFollowUser();
  const unfollowMutation = useUnfollowUser();

  const isOwnProfile = currentUser?.username === handle;

  const handleFollowToggle = () => {
    if (!profile) return;
    
    if (profile.isFollowing) {
      unfollowMutation.mutate({ handle }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetUserProfileQueryKey(handle) });
          queryClient.invalidateQueries({ queryKey: getGetFeedQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetFollowingQueryKey() });
        }
      });
    } else {
      followMutation.mutate({ handle }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetUserProfileQueryKey(handle) });
          queryClient.invalidateQueries({ queryKey: getGetFeedQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetFollowingQueryKey() });
        }
      });
    }
  };

  if (profileLoading) {
    return <div className="p-12 text-center text-muted-foreground font-serif italic">Reading profile...</div>;
  }

  if (profileError || !profile) {
    return <div className="p-12 text-center text-destructive font-serif">Profile not found.</div>;
  }

  const displayName = profile.displayName || profile.username;

  return (
    <div className="flex flex-col min-h-[100dvh]">
      <header className="p-8 border-b border-border/50 bg-card/30">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-serif text-3xl shadow-sm">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="font-serif text-3xl tracking-tight text-foreground">{displayName}</h1>
              <p className="text-muted-foreground font-sans mt-1">@{profile.username}</p>
              
              {profile.bio && (
                <p className="mt-4 text-foreground/90 font-serif leading-relaxed max-w-md">
                  {profile.bio}
                </p>
              )}
              
              <p className="text-xs text-muted-foreground mt-4">
                Joined {format(new Date(profile.createdAt), "MMMM yyyy")}
              </p>
            </div>
          </div>
          
          {!isOwnProfile && (
            <div className="flex flex-row md:flex-col gap-3">
              <Button 
                variant={profile.isFollowing ? "outline" : "default"} 
                className="font-sans shadow-none flex items-center gap-2"
                onClick={handleFollowToggle}
                disabled={followMutation.isPending || unfollowMutation.isPending}
              >
                {profile.isFollowing ? (
                  <><UserMinus size={16} /> Unfollow</>
                ) : (
                  <><UserPlus size={16} /> Follow</>
                )}
              </Button>
              <Button variant="secondary" asChild className="shadow-none flex items-center gap-2">
                <Link href={`/messages/${profile.username}`}>
                  <MessageSquare size={16} /> Message
                </Link>
              </Button>
            </div>
          )}
          
          {isOwnProfile && (
            <Button variant="outline" asChild className="font-sans shadow-none">
              <Link href="/settings">Edit Profile</Link>
            </Button>
          )}
        </div>
      </header>
      
      <div className="flex-1 flex flex-col">
        <div className="px-6 py-4 border-b border-border/30 bg-background/50">
          <h3 className="font-serif text-lg text-foreground">Writings</h3>
        </div>
        
        {postsLoading && (
          <div className="p-8 text-center text-muted-foreground font-serif italic">
            Loading writings...
          </div>
        )}
        
        {postsData && postsData.posts.length === 0 && (
          <div className="p-12 text-center text-muted-foreground font-serif italic">
            No thoughts recorded yet.
          </div>
        )}
        
        {postsData && postsData.posts.length > 0 && (
          <div className="flex flex-col">
            {postsData.posts.map(post => (
              <PostCard key={post.id} post={post} />
            ))}
            
            {!postsData.nextCursor && (
              <div className="p-12 text-center text-muted-foreground font-serif italic text-sm">
                End of entries.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
