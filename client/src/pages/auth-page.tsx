import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, registerSchema } from "@shared/schema";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { user, loginMutation, registerMutation } = useAuth();

  useEffect(() => {
    if (user) {
      if (!user.hasAccess) {
        // If user doesn't have access, redirect to waitlist
        setLocation("/#waitlist-form");
      } else {
        // If user has access, redirect to dashboard
        setLocation("/dashboard");
      }
    }
  }, [user, setLocation]);

  const loginForm = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted p-4">
      <div className="w-full max-w-[1200px] grid md:grid-cols-2 gap-8">
        {/* Info Section - Now visible on both mobile and desktop */}
        <div className="flex flex-col justify-center order-1 md:order-1">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Welcome to Eva Harper</h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8">
            Your AI-powered fashion companion. Get personalized style advice,
            virtual try-ons, and more.
          </p>
          <Alert className="mb-8">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Currently access is by invitation only. Please register on the waitlist.
            </AlertDescription>
          </Alert>
          <img
            src="/assets/eva-harper.webp"
            alt="Fashion"
            className="rounded-lg object-cover aspect-video mt-4 md:mt-8 hidden md:block"
          />
        </div>

        {/* Auth Form Section */}
        <div className="order-2 md:order-2">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Sign In or Register</CardTitle>
              <CardDescription>
                Access your Eva Harper fashion account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="login">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="register">Register</TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  <Form {...loginForm}>
                    <form
                      onSubmit={loginForm.handleSubmit((data) =>
                        loginMutation.mutate(data)
                      )}
                      className="space-y-4"
                    >
                      <FormField
                        control={loginForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={loginMutation.isPending}
                      >
                        Sign In
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => setLocation("/#waitlist-form")}
                      >
                        Join Waitlist
                      </Button>
                    </form>
                  </Form>
                </TabsContent>

                <TabsContent value="register">
                  <Alert className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Registration is currently by invitation only. Please join our waitlist.
                    </AlertDescription>
                  </Alert>
                  <Button
                    className="w-full"
                    onClick={() => setLocation("/#waitlist-form")}
                  >
                    Join Waitlist
                  </Button>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}