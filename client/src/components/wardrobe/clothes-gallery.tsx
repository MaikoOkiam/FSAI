import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ClothesGallery() {
  const { toast } = useToast();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const { data: clothes, refetch: refetchClothes } = useQuery({
    queryKey: ["/api/wardrobe/clothes"],
  });

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch("/api/wardrobe/clothes/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to upload image");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Erfolgreich hochgeladen",
        description: "Das Kleidungsstück wurde zu Ihrer Garderobe hinzugefügt.",
      });
      refetchClothes();
      setSelectedImage(null);
      setPreviewUrl(null);
    },
    onError: (error) => {
      toast({
        title: "Fehler",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedImage) return;

    const formData = new FormData();
    formData.append("image", selectedImage);
    uploadMutation.mutate(formData);
  };

  return (
    <div className="space-y-8">
      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleUpload} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="image">Kleidungsstück hochladen</Label>
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </div>

              {previewUrl && (
                <div className="relative aspect-square">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>
              )}

              <Button
                type="submit"
                disabled={!selectedImage || uploadMutation.isPending}
                className="w-full"
              >
                {uploadMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                Hochladen
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {clothes?.map((item: any) => (
          <div key={item.id} className="relative aspect-square">
            <img
              src={item.imageUrl}
              alt={item.title || "Kleidungsstück"}
              className="w-full h-full object-cover rounded-lg"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
