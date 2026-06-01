import { useAuth } from "@/hooks/use-auth";
import { useUpdateProfile, useDeleteAccount } from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";

const settingsSchema = z.object({
  displayName: z.string().optional(),
  bio: z.string().max(200, "Bio too long").optional(),
});

export default function Settings() {
  const { user, checkAuth, logout } = useAuth();
  const updateMutation = useUpdateProfile();
  const deleteMutation = useDeleteAccount();

  const form = useForm<z.infer<typeof settingsSchema>>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      displayName: user?.displayName || "",
      bio: user?.bio || "",
    },
  });

  const onSubmit = (data: z.infer<typeof settingsSchema>) => {
    updateMutation.mutate({ data }, {
      onSuccess: () => {
        checkAuth();
        toast.success("Profile updated.");
      },
      onError: (error) => {
        toast.error("Failed to update profile.");
      }
    });
  };

  const handleDeleteAccount = () => {
    deleteMutation.mutate(undefined, {
      onSuccess: () => {
        toast.success("Account deleted permanently. Farewell.");
        logout();
      },
      onError: () => {
        toast.error("Failed to delete account.");
      }
    });
  };

  return (
    <div className="flex flex-col min-h-[100dvh]">
      <header className="p-6 border-b border-border/50 sticky top-0 bg-background/95 backdrop-blur-sm z-10">
        <h2 className="font-serif text-2xl tracking-tight text-foreground">Settings</h2>
      </header>

      <div className="p-6 max-w-xl w-full mx-auto space-y-12">
        <section>
          <h3 className="font-serif text-xl text-foreground mb-6">Profile</h3>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground/80">Display Name</FormLabel>
                    <FormControl>
                      <Input placeholder="How you want to be known" {...field} className="bg-card border-border shadow-none" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground/80">Bio</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="A few words about you" 
                        {...field} 
                        className="bg-card border-border shadow-none resize-none min-h-[100px]" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={updateMutation.isPending} className="font-sans shadow-none">
                {updateMutation.isPending ? "Saving..." : "Save changes"}
              </Button>
            </form>
          </Form>
        </section>

        <section className="pt-8 border-t border-border/50">
          <h3 className="font-serif text-xl text-destructive mb-6 flex items-center gap-2">
            <Trash2 size={20} />
            Danger Zone
          </h3>
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6">
            <h4 className="font-medium text-foreground mb-2">Delete Account</h4>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              Once you delete your account, there is no going back. All your posts, messages, and followers will be permanently erased.
            </p>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="shadow-none">Permanently delete</Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-card border-border">
                <AlertDialogHeader>
                  <AlertDialogTitle className="font-serif">Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your account
                    and remove your data from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="shadow-none">Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-none">
                    Yes, delete account
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </section>
      </div>
    </div>
  );
}
