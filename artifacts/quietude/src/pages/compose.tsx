import { useCreatePost } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

const postSchema = z.object({
  content: z.string().min(1, "Post cannot be empty").max(5000, "Post is too long"),
  isPermanent: z.boolean().default(false),
});

export default function Compose() {
  const [, setLocation] = useLocation();
  const createMutation = useCreatePost();

  const form = useForm<z.infer<typeof postSchema>>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      content: "",
      isPermanent: false,
    },
  });

  const onSubmit = (data: z.infer<typeof postSchema>) => {
    createMutation.mutate({ data }, {
      onSuccess: () => {
        toast.success("Thought recorded.");
        setLocation("/feed");
      },
      onError: (error) => {
        toast.error(error.error || "Failed to save post.");
      }
    });
  };

  return (
    <div className="flex flex-col min-h-[100dvh]">
      <header className="p-6 border-b border-border/50 sticky top-0 bg-background/95 backdrop-blur-sm z-10 flex justify-between items-center">
        <h2 className="font-serif text-2xl tracking-tight text-foreground">Write</h2>
      </header>

      <div className="p-6 flex-1 flex flex-col max-w-xl mx-auto w-full">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 flex-1 flex flex-col">
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem className="flex-1 flex flex-col">
                  <FormControl>
                    <Textarea 
                      placeholder="What is on your mind?" 
                      {...field} 
                      className="flex-1 bg-transparent border-none shadow-none resize-none font-serif text-xl leading-relaxed focus-visible:ring-0 p-0 text-foreground" 
                      autoFocus
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="pt-6 border-t border-border/50 mt-auto">
              <FormField
                control={form.control}
                name="isPermanent"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border p-4 bg-card shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base font-medium text-foreground">Permanent thought</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        {field.value 
                          ? "This thought will stay on your profile forever." 
                          : "This thought will drift away after 30 days."}
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <div className="mt-6 flex justify-end gap-3">
                <Button type="button" variant="ghost" onClick={() => setLocation("/feed")} className="font-sans">
                  Discard
                </Button>
                <Button type="submit" disabled={createMutation.isPending} className="font-serif px-8 shadow-none">
                  {createMutation.isPending ? "Recording..." : "Publish"}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
