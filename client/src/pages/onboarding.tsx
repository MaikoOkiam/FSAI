import { useState } from "react";
import { useNavigate, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { userPreferencesSchema, userInterestsSchema } from "@shared/schema";
import { Loader2, Upload } from "lucide-react";

export default function OnboardingPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const [portraitImage, setPortraitImage] = useState<File | null>(null);
  const [fullBodyImage, setFullBodyImage] = useState<File | null>(null);
  const [portraitPreview, setPortraitPreview] = useState<string | null>(null);
  const [fullBodyPreview, setFullBodyPreview] = useState<string | null>(null);

  const form = useForm({
    resolver: zodResolver(userPreferencesSchema),
    defaultValues: {
      style: "",
      age: 25,
      hairColor: "",
      hairStyle: "",
      notifications: {
        email: true,
        styleUpdates: true,
        credits: true,
      },
    },
  });

  const interestsForm = useForm({
    resolver: zodResolver(userInterestsSchema),
    defaultValues: {
      fashionStyles: [],
      favoriteColors: [],
      occasions: [],
    },
  });

  const handleSkip = async () => {
    try {
      await fetch("/api/profile/skip-onboarding", {
        method: "POST",
        credentials: "include",
      });
      toast({
        title: "Onboarding übersprungen",
        description: "Sie können das Onboarding später in Ihrem Profil vervollständigen.",
      });
      setLocation("/dashboard");
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Konnte das Onboarding nicht überspringen.",
        variant: "destructive",
      });
    }
  };

  const handleImageChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "portrait" | "fullBody"
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (type === "portrait") {
        setPortraitImage(file);
        setPortraitPreview(URL.createObjectURL(file));
      } else {
        setFullBodyImage(file);
        setFullBodyPreview(URL.createObjectURL(file));
      }
    }
  };

  const uploadImageMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await fetch("/api/profile/upload-image", {
        method: "POST",
        body: data,
      });
      if (!response.ok) throw new Error("Failed to upload image");
      return response.json();
    },
  });

  const savePreferencesMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/profile/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to save preferences");
      return response.json();
    },
  });

  const completeOnboarding = async () => {
    try {
      // Upload images if selected
      if (portraitImage) {
        const portraitData = new FormData();
        portraitData.append("image", portraitImage);
        portraitData.append("type", "portrait");
        await uploadImageMutation.mutateAsync(portraitData);
      }

      if (fullBodyImage) {
        const fullBodyData = new FormData();
        fullBodyData.append("image", fullBodyImage);
        fullBodyData.append("type", "fullBody");
        await uploadImageMutation.mutateAsync(fullBodyData);
      }

      // Save preferences and interests
      await savePreferencesMutation.mutateAsync({
        preferences: form.getValues(),
        interests: interestsForm.getValues(),
      });

      // Mark onboarding as completed
      await fetch("/api/profile/complete-onboarding", {
        method: "POST",
        credentials: "include",
      });

      toast({
        title: "Erfolg",
        description: "Ihr Profil wurde erfolgreich eingerichtet!",
      });

      setLocation("/dashboard");
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Es gab ein Problem beim Speichern Ihres Profils.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Willkommen bei Eva Harper</CardTitle>
          <CardDescription>
            Lassen Sie uns Ihr Profil einrichten, damit wir Ihnen die beste
            Modeerfahrung bieten können.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="profile">Profil</TabsTrigger>
              <TabsTrigger value="photos">Fotos</TabsTrigger>
              <TabsTrigger value="preferences">Präferenzen</TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <form className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="age">Alter</Label>
                  <Input
                    id="age"
                    type="number"
                    {...form.register("age", { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hairColor">Haarfarbe</Label>
                  <Input id="hairColor" {...form.register("hairColor")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hairStyle">Frisur</Label>
                  <Input id="hairStyle" {...form.register("hairStyle")} />
                </div>
                <Button
                  type="button"
                  onClick={() => setActiveTab("photos")}
                  className="w-full"
                >
                  Weiter zu Fotos
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="photos">
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>Portrait-Foto</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageChange(e, "portrait")}
                  />
                  {portraitPreview && (
                    <img
                      src={portraitPreview}
                      alt="Portrait preview"
                      className="w-40 h-40 object-cover rounded-lg mt-2"
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Ganzkörper-Foto</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageChange(e, "fullBody")}
                  />
                  {fullBodyPreview && (
                    <img
                      src={fullBodyPreview}
                      alt="Full body preview"
                      className="w-40 h-60 object-cover rounded-lg mt-2"
                    />
                  )}
                </div>

                <Button
                  type="button"
                  onClick={() => setActiveTab("preferences")}
                  className="w-full"
                >
                  Weiter zu Präferenzen
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="preferences">
              <form className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Modestil-Präferenzen</Label>
                    <Input
                      placeholder="z.B. Casual, Business, Elegant"
                      {...interestsForm.register("fashionStyles")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Lieblingsfarben</Label>
                    <Input
                      placeholder="z.B. Schwarz, Blau, Rot"
                      {...interestsForm.register("favoriteColors")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Anlässe</Label>
                    <Input
                      placeholder="z.B. Büro, Freizeit, Party"
                      {...interestsForm.register("occasions")}
                    />
                  </div>
                </div>

                <div className="flex space-x-4">
                  <Button
                    onClick={completeOnboarding}
                    className="flex-1"
                    disabled={
                      uploadImageMutation.isPending ||
                      savePreferencesMutation.isPending
                    }
                  >
                    {(uploadImageMutation.isPending ||
                      savePreferencesMutation.isPending) && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Profil fertigstellen
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleSkip}
                    className="flex-1"
                  >
                    Überspringen
                  </Button>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}