import { useAuth } from "@/hooks/use-auth";
import { useUpdateProfile, useDeleteAccount, useUpdateSettings } from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useState, useEffect } from "react";
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

  const [isExporting, setIsExporting] = useState(false);
  const settingsMutation = useUpdateSettings();

  const [mutedWords, setMutedWords] = useState<string[]>(() => {
    const stored = localStorage.getItem("quietude_muted_words");
    return stored ? JSON.parse(stored) : [];
  });
  const [newWord, setNewWord] = useState("");

  const handleAddMutedWord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWord.trim() || mutedWords.includes(newWord.trim().toLowerCase())) return;
    const updated = [...mutedWords, newWord.trim().toLowerCase()];
    setMutedWords(updated);
    localStorage.setItem("quietude_muted_words", JSON.stringify(updated));
    setNewWord("");
  };

  const handleRemoveMutedWord = (word: string) => {
    const updated = mutedWords.filter((w) => w !== word);
    setMutedWords(updated);
    localStorage.setItem("quietude_muted_words", JSON.stringify(updated));
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await fetch('/api/users/me/export', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } // if needed, although mostly it uses cookies
      });
      if (!response.ok) throw new Error("Export failed");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'quietude-data.zip';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Data export complete");
    } catch (error) {
      toast.error("Failed to export data");
    } finally {
      setIsExporting(false);
    }
  };

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
          <h3 className="font-serif text-xl text-foreground mb-6">Privacy & Data</h3>
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 border border-border/50 rounded-lg">
              <div>
                <h4 className="font-medium">Reading Receipts</h4>
                <p className="text-sm text-muted-foreground">Let others know when you've read their messages.</p>
              </div>
              <Switch 
                checked={user?.showReadReceipts}
                onCheckedChange={(checked) => {
                  settingsMutation.mutate({ data: { showReadReceipts: checked } }, {
                    onSuccess: () => {
                      checkAuth();
                      toast.success("Read receipts updated");
                    }
                  });
                }}
                disabled={settingsMutation.isPending}
              />
            </div>
            <div className="flex items-center justify-between p-4 border border-border/50 rounded-lg">
              <div>
                <h4 className="font-medium">Export Data</h4>
                <p className="text-sm text-muted-foreground">Download a ZIP file of all your data (GDPR).</p>
              </div>
              <Button onClick={handleExport} disabled={isExporting} variant="outline" className="shadow-none">
                {isExporting ? "Exporting..." : "Download"}
              </Button>
            </div>
          </div>
        </section>

        <section className="pt-8 border-t border-border/50">
          <h3 className="font-serif text-xl text-foreground mb-6">Muted Words</h3>
          <p className="text-sm text-muted-foreground mb-4">Posts containing these words will be hidden from Explore.</p>
          <form onSubmit={handleAddMutedWord} className="flex gap-2 mb-4">
            <Input 
              value={newWord}
              onChange={(e) => setNewWord(e.target.value)}
              placeholder="Add a word to mute"
              className="bg-card shadow-none"
            />
            <Button type="submit" variant="secondary" className="shadow-none">Add</Button>
          </form>
          <div className="flex flex-wrap gap-2">
            {mutedWords.map((word) => (
              <div key={word} className="flex items-center gap-2 bg-secondary/50 px-3 py-1 rounded-full text-sm">
                <span>{word}</span>
                <button type="button" onClick={() => handleRemoveMutedWord(word)} className="text-muted-foreground hover:text-foreground">
                  &times;
                </button>
              </div>
            ))}
            {mutedWords.length === 0 && <span className="text-sm text-muted-foreground italic">No muted words</span>}
          </div>
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
