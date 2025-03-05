import { NavBar } from "@/components/layout/nav-bar";
import ClothesGallery from "@/components/wardrobe/clothes-gallery";

export default function ClothesPage() {
  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Meine Kleidung</h1>
        <ClothesGallery />
      </main>
    </div>
  );
}
