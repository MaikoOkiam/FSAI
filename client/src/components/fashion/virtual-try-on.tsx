import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

export default function VirtualTryOn() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const tryOnMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch("/api/fashion/try-on", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to process image");
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Virtual try-on completed",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedImage) return;

    const formData = new FormData();
    formData.append("image", selectedImage);
    tryOnMutation.mutate(formData);
  };

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="image">Upload Your Photo</Label>
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
              disabled={!selectedImage || tryOnMutation.isPending}
              className="w-full"
            >
              {tryOnMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              Try On Outfit
            </Button>

            <p className="text-sm text-muted-foreground text-center">
              Credits required: 2 | Remaining: {user?.credits}
            </p>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Try-On Result</h3>
          {tryOnMutation.data ? (
            <img
              src={tryOnMutation.data.url}
              alt="Try-on result"
              className="w-full rounded-lg"
            />
          ) : (
            <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
              <p className="text-muted-foreground">
                Your try-on result will appear here
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
