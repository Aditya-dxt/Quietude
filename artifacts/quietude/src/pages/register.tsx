import { useAuth } from "@/hooks/use-auth";
import { useRegister } from "@workspace/api-client-react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";

const registerSchema = z.object({
  username: z.string().min(2, "Username must be at least 2 characters").max(30, "Username too long"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  displayName: z.string().optional(),
  bio: z.string().max(200, "Bio too long").optional(),
});

export default function Register() {
  const { user, checkAuth } = useAuth();
  const [, setLocation] = useLocation();
  const registerMutation = useRegister();

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      displayName: "",
      bio: "",
    },
  });

  useEffect(() => {
    if (user) {
      setLocation("/feed");
    }
  }, [user, setLocation]);

  const onSubmit = (data: z.infer<typeof registerSchema>) => {
    registerMutation.mutate({ data }, {
      onSuccess: () => {
        checkAuth();
        toast.success("Welcome to Quietude.");
        setLocation("/feed");
      },
      onError: (error) => {
        toast.error((error as { error?: string })?.error || "Failed to create account.");
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background py-12">
      <Card className="w-full max-w-md shadow-sm border-border bg-card">
        <CardHeader className="text-center pb-8 pt-10">
          <CardTitle className="font-serif text-3xl font-medium tracking-tight">Join the quiet</CardTitle>
          <CardDescription className="font-serif italic mt-2 text-muted-foreground text-lg">A space for your thoughts.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground/80">Username (Required)</FormLabel>
                    <FormControl>
                      <Input placeholder="username" {...field} className="bg-background border-border shadow-none" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground/80">Password (Required)</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} className="bg-background border-border shadow-none" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground/80">Display Name</FormLabel>
                    <FormControl>
                      <Input placeholder="How you want to be known" {...field} className="bg-background border-border shadow-none" />
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
                      <Textarea placeholder="A few words about you" {...field} className="bg-background border-border shadow-none resize-none" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="pt-2">
                <Button type="submit" className="w-full py-6 font-serif text-lg shadow-none" disabled={registerMutation.isPending}>
                  {registerMutation.isPending ? "Creating..." : "Create account"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="justify-center border-t border-border pt-6 pb-8">
          <p className="text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline underline-offset-4 font-medium">
              Log in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
