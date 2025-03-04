import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { NavBar } from "@/components/layout/nav-bar";
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
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQuery } from "@tanstack/react-query";

type WaitlistEntry = {
  id: number;
  email: string;
  name: string;
  reason: string;
  createdAt: string;
  status: string;
};

export default function AdminPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  // Check if user has admin access
  useEffect(() => {
    if (!user) {
      setLocation("/auth");
    } else if (!user.username.includes("admin")) {
      toast({
        title: "Access Denied",
        description: "You don't have admin privileges",
        variant: "destructive",
      });
      setLocation("/dashboard");
    }
  }, [user, setLocation, toast]);

  const { data: waitlistEntries, refetch, isLoading, error } = useQuery<WaitlistEntry[]>({
    queryKey: ["/api/admin/waitlist"],
    queryFn: async () => {
      console.log("[Admin Debug] Fetching waitlist data");
      const res = await fetch("/api/admin/waitlist");
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to fetch waitlist");
      }
      const data = await res.json();
      console.log("[Admin Debug] Received waitlist data:", data);
      return data;
    },
    enabled: !!user && user.username.includes("admin"),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">Loading waitlist entries...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center text-red-500">
          Error loading waitlist: {error.message}
        </div>
      </div>
    );
  }

  const approveMutation = useMutation({
    mutationFn: async (email: string) => {
      const res = await fetch("/api/admin/waitlist/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to approve user");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User has been approved",
      });
      refetch();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  function getStatusVariant(status: string): "default" | "secondary" | "outline" {
    switch (status) {
      case "approved":
        return "outline";
      case "registered":
        return "default";
      default:
        return "secondary";
    }
  }

  if (!user || !user.username.includes("admin")) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardHeader>
            <CardTitle>Waitlist Management</CardTitle>
            <CardDescription>
              Approve users from the waitlist to give them access to registration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableCaption>List of users in the waitlist</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {waitlistEntries?.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{entry.name}</TableCell>
                    <TableCell>{entry.email}</TableCell>
                    <TableCell>{new Date(entry.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(entry.status)}>
                        {entry.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {entry.status === "pending" && (
                        <Button
                          size="sm"
                          onClick={() => approveMutation.mutate(entry.email)}
                          disabled={approveMutation.isPending}
                        >
                          Approve
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {!waitlistEntries?.length && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      No waitlist entries found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}