import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { userPreferencesSchema, userInterestsSchema } from "@shared/schema";
import { NavBar } from "@/components/layout/nav-bar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const fashionStyles = [
  "Casual",
  "Business",
  "Elegant",
  "Sportlich",
  "Boho",
  "Minimalistisch",
  "Vintage",
  "Streetwear",
];

const occasions = [
  "Alltag",
  "Büro",
  "Formal",
  "Date",
  "Hochzeit",
  "Party",
  "Sport",
  "Reise",
];

const hairColors = [
  "Schwarz",
  "Dunkelbraun",
  "Hellbraun",
  "Blond",
  "Rot",
  "Grau",
  "Weiß",
  "Gefärbt"
];

const hairStyles = [
  "Kurz",
  "Mittellang",
  "Lang",
  "Locken",
  "Glatt",
  "Wellen",
  "Glatze",
  "Undercut"
];

// Placeholder component -  Needs actual Stripe implementation
const PurchaseCredits = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Purchase Credits</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Credit purchase functionality will be added here.</p>
      </CardContent>
    </Card>
  );
};


export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: savedImages } = useQuery({
    queryKey: ["/api/images/saved"],
  });

  const preferencesForm = useForm({
    resolver: zodResolver(userPreferencesSchema),
    defaultValues: {
      style: user?.preferences?.style || "",
      age: user?.preferences?.age || undefined,
      hairColor: user?.preferences?.hairColor || "",
      hairStyle: user?.preferences?.hairStyle || "",
      notifications: {
        email: user?.preferences?.notifications?.email || false,
        styleUpdates: user?.preferences?.notifications?.styleUpdates || false,
        credits: user?.preferences?.notifications?.credits || false,
      },
    },
  });

  const interestsForm = useForm({
    resolver: zodResolver(userInterestsSchema),
    defaultValues: {
      fashionStyles: user?.interests?.fashionStyles || [],
      favoriteColors: user?.interests?.favoriteColors || [],
      occasions: user?.interests?.occasions || [],
    },
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PATCH", "/api/user/preferences", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Einstellungen aktualisiert",
        description: "Ihre Präferenzen wurden erfolgreich gespeichert.",
      });
    },
  });

  const updateInterestsMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PATCH", "/api/user/interests", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Interessen aktualisiert",
        description: "Ihre Modeinteressen wurden erfolgreich gespeichert.",
      });
    },
  });

  const handleStyleSelection = (styles: string[]) => {
    interestsForm.setValue('fashionStyles', styles);
  };

  const handleOccasionSelection = (occasions: string[]) => {
    interestsForm.setValue('occasions', occasions);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />

      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Mein Profil</h1>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Persönliche Informationen */}
          <Card>
            <CardHeader>
              <CardTitle>Persönliche Informationen</CardTitle>
              <CardDescription>
                Ihre grundlegenden Kontoinformationen
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...preferencesForm}>
                <form
                  onSubmit={preferencesForm.handleSubmit((data) =>
                    updatePreferencesMutation.mutate(data)
                  )}
                  className="space-y-4"
                >
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Benutzername</label>
                      <p className="mt-1">{user?.username}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">E-Mail</label>
                      <p className="mt-1">{user?.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Kontostand</label>
                      <p className="mt-1">{user?.credits} Credits</p>
                    </div>
                  </div>
                  <FormField
                    control={preferencesForm.control}
                    name="age"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Alter</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={13}
                            max={120}
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={preferencesForm.control}
                    name="hairColor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Haarfarbe</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Wählen Sie Ihre Haarfarbe" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {hairColors.map((color) => (
                              <SelectItem key={color} value={color}>
                                {color}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={preferencesForm.control}
                    name="hairStyle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Frisur</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Wählen Sie Ihre Frisur" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {hairStyles.map((style) => (
                              <SelectItem key={style} value={style}>
                                {style}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={preferencesForm.control}
                    name="notifications.email"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>E-Mail-Benachrichtigungen</FormLabel>
                          <FormDescription>
                            Erhalten Sie Updates zu Ihren Styleanalysen
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={preferencesForm.control}
                    name="notifications.styleUpdates"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Style-Updates</FormLabel>
                          <FormDescription>
                            Benachrichtigungen über neue Modetrends
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={preferencesForm.control}
                    name="notifications.credits"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Credit-Benachrichtigungen</FormLabel>
                          <FormDescription>
                            Erhalten Sie Benachrichtigungen über Ihren Credit-Stand
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    disabled={updatePreferencesMutation.isPending}
                  >
                    Einstellungen speichern
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Add Credit Purchase Section */}
          <PurchaseCredits />

          {/* Benachrichtigungseinstellungen */}
          <Card>
            <CardHeader>
              <CardTitle>Benachrichtigungen</CardTitle>
              <CardDescription>
                Verwalten Sie Ihre Benachrichtigungseinstellungen
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...interestsForm}>
                <form
                  onSubmit={interestsForm.handleSubmit((data) =>
                    updateInterestsMutation.mutate(data)
                  )}
                  className="space-y-4"
                >
                  <FormField
                    control={interestsForm.control}
                    name="fashionStyles"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bevorzugte Modestile</FormLabel>
                        <FormControl>
                          <div className="flex flex-wrap gap-2">
                            {fashionStyles.map((style) => (
                              <Button
                                key={style}
                                type="button"
                                variant={field.value.includes(style) ? "default" : "outline"}
                                onClick={() => {
                                  const newStyles = field.value.includes(style)
                                    ? field.value.filter((s: string) => s !== style)
                                    : [...field.value, style];
                                  handleStyleSelection(newStyles);
                                }}
                                className="rounded-full"
                              >
                                {style}
                              </Button>
                            ))}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={interestsForm.control}
                    name="occasions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bevorzugte Anlässe</FormLabel>
                        <FormControl>
                          <div className="flex flex-wrap gap-2">
                            {occasions.map((occasion) => (
                              <Button
                                key={occasion}
                                type="button"
                                variant={field.value.includes(occasion) ? "default" : "outline"}
                                onClick={() => {
                                  const newOccasions = field.value.includes(occasion)
                                    ? field.value.filter((o: string) => o !== occasion)
                                    : [...field.value, occasion];
                                  handleOccasionSelection(newOccasions);
                                }}
                                className="rounded-full"
                              >
                                {occasion}
                              </Button>
                            ))}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    disabled={updateInterestsMutation.isPending}
                  >
                    Interessen speichern
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Gespeicherte Bilder */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Meine gespeicherten Bilder</CardTitle>
              <CardDescription>
                Ihre hochgeladenen und generierten Bilder
              </CardDescription>
            </CardHeader>
            <CardContent>
              {savedImages && savedImages.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {savedImages.map((image: any) => (
                    <div key={image.id} className="relative aspect-square">
                      <img
                        src={image.imageUrl}
                        alt={image.title || "Gespeichertes Bild"}
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/50 text-white text-sm rounded-b-lg">
                        {image.title || "Unbenannt"}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Sie haben noch keine Bilder gespeichert
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}