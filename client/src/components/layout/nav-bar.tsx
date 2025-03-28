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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Settings, User, CreditCard, Shirt, Image } from "lucide-react";

export function NavBar() {
  const { user, logoutMutation } = useAuth();

  return (
    <nav className="border-b">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/">
          <a className="text-2xl logo text-primary">Eva Harper</a>
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
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="flex items-center gap-2"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {user.username[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="hidden md:inline">Credits: {user.credits}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href="/profile">
                          <div className="flex items-center">
                            <User className="mr-2 h-4 w-4" />
                            <span>My Profile</span>
                          </div>
                        </Link>
                      </DropdownMenuItem>

                      <DropdownMenuItem asChild>
                        <Link href="/wardrobe/clothes">
                          <div className="flex items-center">
                            <Shirt className="mr-2 h-4 w-4" />
                            <span>Meine Kleidung</span>
                          </div>
                        </Link>
                      </DropdownMenuItem>

                      <DropdownMenuItem asChild>
                        <Link href="/wardrobe/outfits">
                          <div className="flex items-center">
                            <Image className="mr-2 h-4 w-4" />
                            <span>Meine Outfits</span>
                          </div>
                        </Link>
                      </DropdownMenuItem>

                      <DropdownMenuItem asChild>
                        <Link href="/profile#credits">
                          <CreditCard className="mr-2 h-4 w-4" />
                          Credits: {user.credits || 0}
                        </Link>
                      </DropdownMenuItem>
                      {user.username.includes("admin") && (
                        <DropdownMenuItem asChild>
                          <Link href="/admin">
                            <div className="flex items-center">
                              <Settings className="mr-2 h-4 w-4" />
                              <span>Admin Panel</span>
                            </div>
                          </Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => logoutMutation.mutate()}
                        className="text-red-500"
                      >
                        Sign Out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
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