import { useLocation } from "wouter";
import { NavBar } from "@/components/layout/nav-bar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ChatAdvisor from "@/components/fashion/chat-advisor";
import VirtualTryOn from "@/components/fashion/virtual-try-on";
import StyleTransfer from "@/components/fashion/style-transfer";
import OutfitRating from "@/components/fashion/outfit-rating";

export default function Dashboard() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(location.split("?")[1]);
  const defaultTab = searchParams.get("tab") || "chat";

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />

      <main className="flex-1 container mx-auto px-4 py-8">
        <Tabs defaultValue={defaultTab} className="space-y-8">
          <TabsList className="grid grid-cols-2 lg:grid-cols-4 w-full">
            <TabsTrigger value="chat">Fashion Advisor</TabsTrigger>
            <TabsTrigger value="try-on">Virtual Try-On</TabsTrigger>
            <TabsTrigger value="transfer">Style Transfer</TabsTrigger>
            <TabsTrigger value="rate">Outfit Rating</TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="space-y-4">
            <h2 className="text-2xl font-bold">Fashion Advisor Chat</h2>
            <p className="text-muted-foreground">
              Get personalized fashion advice from Eva Harper's AI
            </p>
            <ChatAdvisor />
          </TabsContent>

          <TabsContent value="try-on" className="space-y-4">
            <h2 className="text-2xl font-bold">Virtual Try-On</h2>
            <p className="text-muted-foreground">
              See how clothes look on you before buying
            </p>
            <VirtualTryOn />
          </TabsContent>

          <TabsContent value="transfer" className="space-y-4">
            <h2 className="text-2xl font-bold">Style Transfer</h2>
            <p className="text-muted-foreground">
              Transform your look with AI style transfer
            </p>
            <StyleTransfer />
          </TabsContent>

          <TabsContent value="rate" className="space-y-4">
            <h2 className="text-2xl font-bold">Outfit Rating</h2>
            <p className="text-muted-foreground">
              Get feedback on your outfits for any occasion
            </p>
            <OutfitRating />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
