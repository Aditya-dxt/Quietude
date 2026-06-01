import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground font-serif flex flex-col">
      <header className="p-6 flex justify-between items-center max-w-5xl mx-auto w-full">
        <h1 className="text-2xl tracking-tight text-primary font-serif">Quietude.</h1>
        <div className="space-x-4">
          <Button variant="ghost" asChild className="font-sans">
            <Link href="/login">Log in</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center max-w-3xl mx-auto px-6 py-20 text-center">
        <h2 className="text-5xl md:text-7xl font-medium tracking-tight leading-tight mb-8 text-foreground">
          A place for <span className="text-primary italic">thoughts</span>, <br className="hidden md:block"/>not performance.
        </h2>
        
        <p className="text-lg md:text-2xl text-muted-foreground mb-12 max-w-2xl leading-relaxed">
          Quietude strips away the noise. No follower counts. No trending topics. No viral manipulation. Just a calm corner to write, read, and exist without algorithmic anxiety.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Button asChild size="lg" className="text-lg px-8 py-6 h-auto shadow-none font-sans">
            <Link href="/register">Join the quiet</Link>
          </Button>
          <Button variant="outline" asChild size="lg" className="text-lg px-8 py-6 h-auto border-border text-foreground hover:bg-secondary font-sans">
            <Link href="/explore">Read thoughts</Link>
          </Button>
        </div>
      </main>

      <footer className="py-12 border-t border-border mt-auto">
        <div className="max-w-5xl mx-auto px-6 text-center text-muted-foreground text-sm font-sans">
          Designed for reading like a handwritten letter.
        </div>
      </footer>
    </div>
  );
}
