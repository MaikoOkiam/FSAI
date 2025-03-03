import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Wand2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

export default function StyleTransfer() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [sourceImage, setSourceImage] = useState<File | null>(null);
  const [targetImage, setTargetImage] = useState<File | null>(null);
  const [sourcePreview, setSourcePreview] = useState<string | null>(null);
  const [targetPreview, setTargetPreview] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>("");

  const transferMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch("/api/fashion/transfer", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to transfer style");
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Style transfer completed",
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

  const handleSourceImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSourceImage(file);
      setSourcePreview(URL.createObjectURL(file));
    }
  };

  const handleTargetImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setTargetImage(file);
      setTargetPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceImage || !targetImage || !prompt.trim()) return;

    const formData = new FormData();
    formData.append("sourceImage", sourceImage);
    formData.append("targetImage", targetImage);
    formData.append("prompt", prompt);
    transferMutation.mutate(formData);
  };

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sourceImage">Erstes Gesichtsbild</Label>
              <Input
                id="sourceImage"
                type="file"
                accept="image/*"
                onChange={handleSourceImageChange}
              />
              {sourcePreview && (
                <div className="relative aspect-square">
                  <img
                    src={sourcePreview}
                    alt="Erstes Bild"
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetImage">Zweites Gesichtsbild</Label>
              <Input
                id="targetImage"
                type="file"
                accept="image/*"
                onChange={handleTargetImageChange}
              />
              {targetPreview && (
                <div className="relative aspect-square">
                  <img
                    src={targetPreview}
                    alt="Zweites Bild"
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="prompt">Beschreibung des gewünschten Stils</Label>
              <Textarea
                id="prompt"
                placeholder="z.B. 'professionelles Modefoto im Vintage-Stil'"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
            </div>

            <Button
              type="submit"
              disabled={!sourceImage || !targetImage || !prompt.trim() || transferMutation.isPending}
              className="w-full"
            >
              {transferMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Wand2 className="h-4 w-4 mr-2" />
              )}
              Style Transfer starten
            </Button>

            <p className="text-sm text-muted-foreground text-center">
              Credits benötigt: 3 | Verbleibend: {user?.credits}
            </p>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Style Transfer Ergebnis</h3>
          {transferMutation.data ? (
            <img
              src={transferMutation.data.url}
              alt="Style transfer result"
              className="w-full rounded-lg"
            />
          ) : (
            <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
              <p className="text-muted-foreground">
                Ihr Style Transfer Ergebnis wird hier erscheinen
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}