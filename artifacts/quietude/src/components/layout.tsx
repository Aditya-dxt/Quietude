import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useLogout } from "@workspace/api-client-react";
import { LogOut, Home, Compass, MessageCircle, User, Settings, PenSquare, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const logoutMutation = useLogout();

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        logout();
      }
    });
  };

  if (!user) {
    return <div className="min-h-[100dvh] bg-background text-foreground">{children}</div>;
  }

  const navItems = [
    { href: "/feed", icon: Home, label: "Home" },
    { href: "/explore", icon: Compass, label: "Explore" },
    { href: "/search", icon: Search, label: "Search" },
    { href: "/messages", icon: MessageCircle, label: "Messages" },
    { href: `/u/${user.username}`, icon: User, label: "Profile" },
    { href: "/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex justify-center">
      <div className="w-full max-w-4xl flex flex-col md:flex-row relative">
        <aside className="md:w-64 md:border-r border-border md:min-h-[100dvh] p-4 flex flex-col justify-between sticky top-0 md:h-[100dvh] bg-background z-10 hidden md:flex">
          <div>
            <div className="mb-8 px-4">
              <h1 className="font-serif text-2xl tracking-tight text-primary">Quietude.</h1>
            </div>
            <nav className="flex flex-col gap-2">
              {navItems.map((item) => {
                const isActive = location === item.href || location.startsWith(item.href + '/');
                return (
                  <Link key={item.href} href={item.href}>
                    <div className={`flex items-center gap-4 px-4 py-3 rounded-md transition-colors ${isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-accent text-muted-foreground hover:text-foreground'}`}>
                      <item.icon size={20} />
                      <span className="font-medium">{item.label}</span>
                    </div>
                  </Link>
                );
              })}
            </nav>
            <div className="mt-8 px-4">
              <Button asChild className="w-full justify-start gap-2 shadow-none font-serif text-lg py-6 bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground">
                <Link href="/post/new">
                  <PenSquare size={20} />
                  Write
                </Link>
              </Button>
            </div>
          </div>
          
          <div className="mt-auto pt-4">
            <button 
              onClick={handleLogout}
              className="flex items-center gap-4 px-4 py-3 w-full rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut size={20} />
              <span className="font-medium">Log out</span>
            </button>
          </div>
        </aside>

        <main className="flex-1 w-full max-w-2xl mx-auto border-x border-border/50 bg-card/30 min-h-[100dvh] pb-24 md:pb-0">
          {children}
        </main>

        {/* Mobile bottom nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-background flex justify-around p-3 z-50">
          {navItems.slice(0, 4).map((item) => {
            const isActive = location === item.href || location.startsWith(item.href + '/');
            return (
              <Link key={item.href} href={item.href}>
                <div className={`p-2 rounded-full ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                  <item.icon size={24} />
                </div>
              </Link>
            );
          })}
          <Link href="/post/new">
             <div className="p-2 rounded-full bg-primary text-primary-foreground -mt-4 shadow-sm border-4 border-background">
               <PenSquare size={20} />
             </div>
          </Link>
        </nav>
      </div>
    </div>
  );
}
