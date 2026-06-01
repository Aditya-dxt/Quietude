import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { AppLayout } from "@/components/layout";

import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Feed from "@/pages/feed";
import Explore from "@/pages/explore";
import Compose from "@/pages/compose";
import Profile from "@/pages/profile";
import MessagesList from "@/pages/messages-list";
import MessageThread from "@/pages/message-thread";
import Settings from "@/pages/settings";

const queryClient = new QueryClient();

// A wrapper that protects routes that require authentication
function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center font-serif text-muted-foreground italic">Breathing...</div>;
  }
  
  if (!user) {
    // Return a dummy empty page to avoid flash before redirect happens in hooks
    return <div className="min-h-screen bg-background" />;
  }
  
  return <Component />;
}

// A wrapper that redirects to feed if already logged in (for login/landing)
function PublicRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center font-serif text-muted-foreground italic">Breathing...</div>;
  }
  
  // user is handled in the component itself (e.g. login redirects to /feed if user exists)
  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => <PublicRoute component={Landing} />} />
      <Route path="/login" component={() => <PublicRoute component={Login} />} />
      <Route path="/register" component={() => <PublicRoute component={Register} />} />
      
      <Route path="/feed" component={() => <ProtectedRoute component={() => <AppLayout><Feed /></AppLayout>} />} />
      <Route path="/explore" component={() => <ProtectedRoute component={() => <AppLayout><Explore /></AppLayout>} />} />
      <Route path="/post/new" component={() => <ProtectedRoute component={() => <AppLayout><Compose /></AppLayout>} />} />
      <Route path="/u/:handle" component={() => <ProtectedRoute component={() => <AppLayout><Profile /></AppLayout>} />} />
      <Route path="/messages" component={() => <ProtectedRoute component={() => <AppLayout><MessagesList /></AppLayout>} />} />
      <Route path="/messages/:handle" component={() => <ProtectedRoute component={() => <AppLayout><MessageThread /></AppLayout>} />} />
      <Route path="/settings" component={() => <ProtectedRoute component={() => <AppLayout><Settings /></AppLayout>} />} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
