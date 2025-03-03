import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

const occasions = [
  "Casual Day Out",
  "Office Work",
  "Formal Event",
  "Date Night",
  "Wedding Guest",
  "Beach Party",
  "Business Meeting",
];

export default function OutfitRating() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [occasion, setOccasion] = useState<string>("");

  const ratingMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch("/api/fashion/analyze", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to analyze outfit");
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Analysis Complete",
        description: `Rating: ${data.rating}/10`,
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
    if (!selectedImage || !occasion) return;

    const formData = new FormData();
    formData.append("image", selectedImage);
    formData.append("occasion", occasion);
    ratingMutation.mutate(formData);
  };

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="outfit">Upload Your Outfit</Label>
              <Input
                id="outfit"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="occasion">Select Occasion</Label>
              <Select onValueChange={setOccasion} value={occasion}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an occasion" />
                </SelectTrigger>
                <SelectContent>
                  {occasions.map((occ) => (
                    <SelectItem key={occ} value={occ}>
                      {occ}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              disabled={!selectedImage || !occasion || ratingMutation.isPending}
              className="w-full"
            >
              {ratingMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Star className="h-4 w-4 mr-2" />
              )}
              Rate Outfit
            </Button>

            <p className="text-sm text-muted-foreground text-center">
              Credits required: 2 | Remaining: {user?.credits}
            </p>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Outfit Analysis</h3>
          {ratingMutation.data ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 fill-primary text-primary" />
                <span className="text-xl font-semibold">
                  {ratingMutation.data.rating}/10
                </span>
              </div>
              <p className="text-muted-foreground">
                {ratingMutation.data.feedback}
              </p>
              <div className="space-y-2">
                <h4 className="font-semibold">Suggestions:</h4>
                <ul className="list-disc list-inside space-y-1">
                  {ratingMutation.data.suggestions.map((suggestion: string, i: number) => (
                    <li key={i}>{suggestion}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="h-[300px] bg-muted rounded-lg flex items-center justify-center">
              <p className="text-muted-foreground">
                Upload an outfit to get Eva's professional analysis
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
