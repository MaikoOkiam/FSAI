import { NavBar } from "@/components/layout/nav-bar";
import OutfitsGallery from "@/components/wardrobe/outfits-gallery";

export default function OutfitsPage() {
  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Meine Outfits</h1>
        <OutfitsGallery />
      </main>
    </div>
  );
}
