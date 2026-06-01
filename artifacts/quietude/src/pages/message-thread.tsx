import { useListMessages, useSendMessage, useGetUserProfile, getListMessagesQueryKey, getGetConversationsQueryKey } from "@workspace/api-client-react";
import { useParams } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { Send, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { useEffect, useRef } from "react";
import { format } from "date-fns";

const messageSchema = z.object({
  content: z.string().min(1).max(2000),
});

export default function MessageThread() {
  const { handle } = useParams<{ handle: string }>();
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: profile } = useGetUserProfile(handle || "", { 
    query: { enabled: !!handle } 
  });
  
  const { data: messages, isLoading } = useListMessages(handle || "", { 
    query: { enabled: !!handle, refetchInterval: 10000 } // Poll every 10s
  });

  const sendMutation = useSendMessage();

  const form = useForm<z.infer<typeof messageSchema>>({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      content: "",
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const onSubmit = (data: z.infer<typeof messageSchema>) => {
    if (!handle) return;
    
    sendMutation.mutate({ handle, data }, {
      onSuccess: () => {
        form.reset();
        queryClient.invalidateQueries({ queryKey: getListMessagesQueryKey(handle) });
        queryClient.invalidateQueries({ queryKey: getGetConversationsQueryKey() });
      }
    });
  };

  const displayName = profile?.displayName || handle;

  return (
    <div className="flex flex-col h-[100dvh]">
      <header className="p-4 border-b border-border/50 bg-background/95 backdrop-blur-sm z-10 flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="text-muted-foreground hover:text-foreground shrink-0">
          <Link href="/messages">
            <ArrowLeft size={20} />
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground font-serif text-sm">
            {displayName?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="font-serif text-lg tracking-tight text-foreground leading-none">{displayName}</h2>
            <p className="text-xs text-muted-foreground mt-1">@{handle}</p>
          </div>
        </div>
      </header>
      
      <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-4">
        {isLoading && (
          <div className="flex-1 flex items-center justify-center text-muted-foreground font-serif italic">
            Reading letters...
          </div>
        )}
        
        {!isLoading && messages?.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground font-serif italic h-full py-12">
            <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center mb-4">
              {displayName?.charAt(0).toUpperCase()}
            </div>
            This is the beginning of your correspondence with {displayName}.
          </div>
        )}
        
        {messages?.map((msg, idx) => {
          const isOwn = msg.isOwn;
          const showTime = idx === 0 || new Date(msg.createdAt).getTime() - new Date(messages[idx-1].createdAt).getTime() > 1000 * 60 * 60; // > 1 hr diff
          
          return (
            <div key={msg.id} className="flex flex-col">
              {showTime && (
                <div className="text-center my-4">
                  <span className="text-xs text-muted-foreground font-sans bg-background px-2">
                    {format(new Date(msg.createdAt), "MMM d, h:mm a")}
                  </span>
                </div>
              )}
              <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} w-full group`}>
                <div className={`
                  max-w-[85%] rounded-2xl px-5 py-3 text-base
                  ${isOwn 
                    ? 'bg-primary text-primary-foreground rounded-br-sm' 
                    : 'bg-card border border-border text-card-foreground rounded-bl-sm'}
                `}>
                  <p className="whitespace-pre-wrap font-sans">{msg.content}</p>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-background border-t border-border">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex gap-2 items-end">
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Textarea 
                      placeholder="Write a message..." 
                      {...field} 
                      className="min-h-[50px] max-h-32 resize-none bg-card border-border rounded-xl focus-visible:ring-1 focus-visible:ring-primary shadow-none py-3 px-4" 
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          form.handleSubmit(onSubmit)();
                        }
                      }}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <Button 
              type="submit" 
              size="icon" 
              className="h-12 w-12 rounded-full shrink-0 shadow-none bg-primary text-primary-foreground hover:bg-primary/90" 
              disabled={sendMutation.isPending || !form.watch("content").trim()}
            >
              <Send size={18} className="ml-1" />
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
