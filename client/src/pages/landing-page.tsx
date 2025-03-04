import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { NavBar } from "@/components/layout/nav-bar";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import {
  MessageSquare,
  Shirt,
  Sparkles,
  Star
} from "lucide-react";

export default function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 px-4 text-center bg-gradient-to-b from-background to-muted">
          <div className="container mx-auto max-w-4xl">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Your Personal AI Fashion Stylist
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8">
              Let Eva Harper's AI-powered fashion platform help you discover and perfect your personal style
            </p>
            <Button asChild size="lg" className="text-lg">
              <Link href={user ? "/dashboard" : "/auth"}>
                Get Started
              </Link>
            </Button>
          </div>
        </section>


        {/* Features Section */}
        <section className="py-20 px-4">
          <div className="container mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
              <div>
                <h2 className="text-3xl font-bold mb-6">
                  Meet Eva Harper
                </h2>
                <p className="text-lg text-muted-foreground mb-6">
                  Your dedicated AI fashion expert, available 24/7 to help you create your perfect style and make confident fashion choices.
                </p>
              </div>
              <div className="order-first md:order-last">
                <img
                  src="/assets/eva-harper.webp"
                  alt="Eva Harper - Your AI Fashion Assistant"
                  className="w-full rounded-lg shadow-xl"
                />
              </div>
            </div>

            <h2 className="text-3xl font-bold text-center mb-12">
              AI-Powered Fashion Features
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <Card>
                <CardContent className="pt-6">
                  <MessageSquare className="h-12 w-12 text-primary mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Fashion Advisor</h3>
                  <p className="text-muted-foreground">
                    Get personalized style advice from our AI fashion expert
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
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <Sparkles className="h-12 w-12 text-primary mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Style Transfer</h3>
                  <p className="text-muted-foreground">
                    Transform your look with AI-powered style transfer
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <Star className="h-12 w-12 text-primary mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Outfit Rating</h3>
                  <p className="text-muted-foreground">
                    Get feedback on your outfits for any occasion
                  </p>
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
                  <Button className="w-full" asChild>
                    <Link href="/auth">Get Started</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-xl font-semibold mb-4">Monthly</h3>
                  <p className="text-3xl font-bold mb-4">$19.99</p>
                  <Button className="w-full" asChild>
                    <Link href="/auth">Subscribe</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-xl font-semibold mb-4">Yearly</h3>
                  <p className="text-3xl font-bold mb-4">$199.99</p>
                  <Button className="w-full" asChild>
                    <Link href="/auth">Subscribe</Link>
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