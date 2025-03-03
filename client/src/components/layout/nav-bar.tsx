import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function NavBar() {
  const { user, logoutMutation } = useAuth();

  return (
    <nav className="border-b">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/">
          <a className="text-2xl font-bold text-primary">Eva Harper</a>
        </Link>

        <NavigationMenu>
          <NavigationMenuList>
            {user ? (
              <>
                <NavigationMenuItem>
                  <NavigationMenuTrigger>Features</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="grid gap-3 p-6 w-[400px]">
                      <NavigationMenuLink asChild>
                        <Link href="/dashboard?tab=chat">Fashion Advisor</Link>
                      </NavigationMenuLink>
                      <NavigationMenuLink asChild>
                        <Link href="/dashboard?tab=try-on">Virtual Try-On</Link>
                      </NavigationMenuLink>
                      <NavigationMenuLink asChild>
                        <Link href="/dashboard?tab=transfer">Style Transfer</Link>
                      </NavigationMenuLink>
                      <NavigationMenuLink asChild>
                        <Link href="/dashboard?tab=rate">Outfit Rating</Link>
                      </NavigationMenuLink>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2"
                    onClick={() => logoutMutation.mutate()}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {user.username[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span>Credits: {user.credits}</span>
                  </Button>
                </NavigationMenuItem>
              </>
            ) : (
              <NavigationMenuItem>
                <Link href="/auth">
                  <Button>Sign In</Button>
                </Link>
              </NavigationMenuItem>
            )}
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    </nav>
  );
}
