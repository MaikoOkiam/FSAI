import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { NavBar } from "@/components/layout/nav-bar";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import {
  MessageSquare,
  Shirt,
  Sparkles,
  Star,
  Loader2
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function LandingPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");

  const waitlistMutation = useMutation({
    mutationFn: async (data: { email: string; name: string }) => {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Registrierung fehlgeschlagen");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Erfolgreich registriert",
        description: "Wir werden Sie benachrichtigen, sobald Ihr Zugang freigeschaltet wird.",
      });
      setEmail("");
      setName("");
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    waitlistMutation.mutate({ email, name });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />

      <main className="flex-1">
        {/* Eva Image Section */}
        <section className="py-8 px-4">
          <div className="container mx-auto max-w-lg">
            <img
              src="/assets/eva-harper.webp"
              alt="Eva Harper - Your AI Fashion Assistant"
              className="w-full rounded-lg shadow-xl"
            />
          </div>
        </section>

        {/* Hero Section */}
        <section className="py-20 px-4 text-center bg-gradient-to-b from-background to-muted">
          <div className="container mx-auto max-w-4xl">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Your Personal AI Fashion Stylist
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-12">
              Let Eva Harper's AI-powered fashion platform help you discover and perfect your personal style. 
              Join our exclusive waitlist for early access.
            </p>

            {/* Waitlist Form */}
            <Card className="max-w-md mx-auto" id="waitlist-form">
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Input
                      type="text"
                      placeholder="Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Input
                      type="email"
                      placeholder="E-Mail"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={waitlistMutation.isPending}
                  >
                    {waitlistMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Request Access
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-4">
          <div className="container mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">
              AI-Powered Fashion Features
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <Card>
                <CardContent className="pt-6">
                  <Star className="h-12 w-12 text-primary mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Outfit Rating</h3>
                  <p className="text-muted-foreground">
                    Get feedback on your outfits for any occasion
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <Shirt className="h-12 w-12 text-primary mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Virtual Try-On</h3>
                  <p className="text-muted-foreground">
                    See how clothes look on you before buying
                  </p>
                  <span className="inline-block mt-2 text-sm bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                    Coming Soon
                  </span>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <Sparkles className="h-12 w-12 text-primary mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Style Transfer</h3>
                  <p className="text-muted-foreground">
                    Transform your look with AI-powered style transfer
                  </p>
                  <span className="inline-block mt-2 text-sm bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                    Coming Soon
                  </span>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <MessageSquare className="h-12 w-12 text-primary mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Fashion Advisor</h3>
                  <p className="text-muted-foreground">
                    Get personalized style advice from our AI fashion expert
                  </p>
                  <span className="inline-block mt-2 text-sm bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                    Coming Soon
                  </span>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-20 px-4 bg-muted">
          <div className="container mx-auto text-center">
            <h2 className="text-3xl font-bold mb-12">Simple Pricing</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-xl font-semibold mb-4">Free Trial</h3>
                  <p className="text-3xl font-bold mb-4">10 Credits</p>
                  <Button className="w-full" onClick={() => {
                    document.getElementById('waitlist-form')?.scrollIntoView({ behavior: 'smooth' });
                  }}>
                    Request Access
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-xl font-semibold mb-4">Monthly</h3>
                  <p className="text-3xl font-bold mb-4">$19.99</p>
                  <Button className="w-full" onClick={() => {
                    document.getElementById('waitlist-form')?.scrollIntoView({ behavior: 'smooth' });
                  }}>
                    Request Access
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-xl font-semibold mb-4">Yearly</h3>
                  <p className="text-3xl font-bold mb-4">$199.99</p>
                  <Button className="w-full" onClick={() => {
                    document.getElementById('waitlist-form')?.scrollIntoView({ behavior: 'smooth' });
                  }}>
                    Request Access
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-8 px-4 border-t">
        <div className="container mx-auto text-center text-muted-foreground">
          © 2024 Eva Harper. All rights reserved.
        </div>
      </footer>
    </div>
  );
}