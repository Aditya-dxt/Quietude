import { useAuth } from "@/hooks/use-auth";
import { useLogin } from "@workspace/api-client-react";
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

const loginSchema = z.object({
  username: z.string().min(2, "Username must be at least 2 characters"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export default function Login() {
  const { user, checkAuth } = useAuth();
  const [, setLocation] = useLocation();
  const loginMutation = useLogin();

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  useEffect(() => {
    if (user) {
      setLocation("/feed");
    }
  }, [user, setLocation]);

  const onSubmit = (data: z.infer<typeof loginSchema>) => {
    loginMutation.mutate({ data }, {
      onSuccess: () => {
        checkAuth();
        toast.success("Welcome back.");
        setLocation("/feed");
      },
      onError: (error) => {
        toast.error(error.error || "Failed to log in.");
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md shadow-sm border-border bg-card">
        <CardHeader className="text-center pb-8 pt-10">
          <CardTitle className="font-serif text-3xl font-medium tracking-tight">Return</CardTitle>
          <CardDescription className="font-serif italic mt-2 text-muted-foreground text-lg">Pick up where you left off.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground/80">Username</FormLabel>
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
                    <FormLabel className="text-foreground/80">Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} className="bg-background border-border shadow-none" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full py-6 font-serif text-lg shadow-none" disabled={loginMutation.isPending}>
                {loginMutation.isPending ? "Entering..." : "Log in"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="justify-center border-t border-border pt-6 pb-8">
          <p className="text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/register" className="text-primary hover:underline underline-offset-4 font-medium">
              Join
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
