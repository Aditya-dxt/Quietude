import { useCreatePost } from "@workspace/api-client-react";
import { useState, useRef } from "react";
import { Image as ImageIcon, X } from "lucide-react";
import { Input } from "@/components/ui/input";
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
  imageUrl: z.string().optional(),
  isSensitive: z.boolean().default(false),
  contentWarning: z.string().optional(),
});

export default function Compose() {
  const [, setLocation] = useLocation();
  const createMutation = useCreatePost();

  const form = useForm<z.infer<typeof postSchema>>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      content: "",
      isPermanent: false,
      isSensitive: false,
      contentWarning: "",
    },
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be smaller than 5MB");
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onSubmit = async (data: z.infer<typeof postSchema>) => {
    try {
      let uploadedUrl = data.imageUrl;
      if (imageFile) {
        setIsUploading(true);
        const formData = new FormData();
        formData.append("image", imageFile);
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        if (!res.ok) throw new Error("Upload failed");
        const uploadData = await res.json();
        uploadedUrl = uploadData.url;
        setIsUploading(false);
      }
      
      createMutation.mutate({ data: { ...data, imageUrl: uploadedUrl } }, {
        onSuccess: () => {
          toast.success("Thought recorded.");
          setLocation("/feed");
        },
        onError: (error) => {
          setIsUploading(false);
          toast.error((error as { error?: string })?.error || "Failed to save post.");
        }
      });
    } catch (e) {
      setIsUploading(false);
      toast.error("Failed to upload image");
    }
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
            
            {imagePreview && (
              <div className="relative mt-4 self-start rounded-xl overflow-hidden border border-border">
                <img src={imagePreview} alt="Preview" className="max-h-[400px] object-cover" />
                <Button 
                  type="button" 
                  variant="destructive" 
                  size="icon" 
                  className="absolute top-2 right-2 h-8 w-8 rounded-full shadow-md"
                  onClick={removeImage}
                >
                  <X size={16} />
                </Button>
              </div>
            )}
            
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
              
              <FormField
                control={form.control}
                name="isSensitive"
                render={({ field }) => (
                  <FormItem className="flex flex-col mt-4 rounded-lg border border-border p-4 bg-card shadow-sm">
                    <div className="flex flex-row items-center justify-between">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base font-medium text-foreground">Mark as sensitive</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Blur this post and require a tap to view.
                        </div>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </div>
                    {field.value && (
                      <div className="pt-4 mt-2 border-t border-border/50">
                        <FormField
                          control={form.control}
                          name="contentWarning"
                          render={({ field: warningField }) => (
                            <FormItem>
                              <FormLabel>Add a content warning label (optional)</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g. politics, spoilers" {...warningField} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    )}
                  </FormItem>
                )}
              />
              
              <div className="mt-6 flex justify-between items-center gap-3">
                <div className="flex flex-col">
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    className="gap-2 rounded-full font-sans"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <ImageIcon size={16} />
                    Attach Image
                  </Button>
                  <input 
                    type="file" 
                    accept="image/jpeg, image/png, image/webp, image/gif" 
                    className="hidden" 
                    ref={fileInputRef} 
                    onChange={handleImageChange} 
                  />
                  <span className="text-[10px] text-muted-foreground mt-1 ml-1">
                    Location and device data are automatically removed
                  </span>
                </div>
                
                <div className="flex justify-end gap-3">
                  <Button type="button" variant="ghost" onClick={() => setLocation("/feed")} className="font-sans">
                    Discard
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || isUploading} className="font-serif px-8 shadow-none">
                    {createMutation.isPending || isUploading ? "Recording..." : "Publish"}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
