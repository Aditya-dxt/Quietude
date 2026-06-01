import { useGetConversations } from "@workspace/api-client-react";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";

export default function MessagesList() {
  const { data: conversations, isLoading, isError } = useGetConversations();

  return (
    <div className="flex flex-col min-h-[100dvh]">
      <header className="p-6 border-b border-border/50 sticky top-0 bg-background/95 backdrop-blur-sm z-10">
        <h2 className="font-serif text-2xl tracking-tight text-foreground">Letters</h2>
        <p className="text-sm text-muted-foreground mt-1">Direct correspondence with others.</p>
      </header>
      
      <div className="flex-1 flex flex-col">
        {isLoading && (
          <div className="p-8 text-center text-muted-foreground font-serif italic">
            Checking mailbox...
          </div>
        )}
        
        {isError && (
          <div className="p-8 text-center text-destructive font-serif">
            Something went wrong retrieving your letters.
          </div>
        )}
        
        {conversations && conversations.length === 0 && (
          <div className="p-12 text-center text-muted-foreground font-serif italic flex flex-col items-center justify-center h-64">
            No correspondence yet. Visit a profile to start writing.
          </div>
        )}
        
        {conversations && conversations.length > 0 && (
          <div className="flex flex-col">
            {conversations.map(conv => {
              const user = conv.withUser;
              const displayName = user.displayName || user.username;
              
              return (
                <Link key={user.username} href={`/messages/${user.username}`}>
                  <article className="p-6 border-b border-border/50 hover:bg-card/50 transition-colors flex items-center gap-4 cursor-pointer">
                    <div className="w-12 h-12 rounded-full bg-secondary flex-shrink-0 flex items-center justify-center text-secondary-foreground font-serif text-xl">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-1">
                        <div className="font-serif font-medium text-foreground truncate text-lg">
                          {displayName}
                        </div>
                        <time className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                          {formatDistanceToNow(new Date(conv.updatedAt))} ago
                        </time>
                      </div>
                      {conv.lastMessage ? (
                        <p className="text-muted-foreground font-sans text-sm truncate">
                          {conv.lastMessage}
                        </p>
                      ) : (
                        <p className="text-muted-foreground/50 font-serif italic text-sm">
                          Start a conversation
                        </p>
                      )}
                    </div>
                  </article>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
