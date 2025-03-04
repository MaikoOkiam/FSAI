import { useAuth } from "../hooks/use-auth";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { NavBar } from "../components/layout/nav-bar";
import { useToast } from "../components/ui/use-toast";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Pagination } from "../components/ui/pagination";

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
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

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

  const approveMutation = useMutation({
    mutationFn: async (email: string) => {
      console.log("[Admin Debug] Approving email:", email);
      const res = await fetch("/api/admin/waitlist/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to approve user");
      }

      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: data.message || "User has been approved successfully",
      });
      console.log("[Admin Debug] Approval successful:", data);
      refetch(); // Refresh the waitlist data
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      console.error("[AdminPage Error]", error);
    },
  });

  const handleApprove = (email: string) => {
    console.log("[Admin Debug] Handling approval for:", email);
    approveMutation.mutate(email);
  };

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

  // Always render a consistent component structure with hooks
  if (!user || !user.username.includes("admin")) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <NavBar />
        <div className="flex items-center justify-center p-8">
          <div className="text-center">Loading waitlist entries...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <NavBar />
        <div className="flex items-center justify-center p-8">
          <div className="text-center text-red-500">
            Error loading waitlist: {(error as Error).message}
          </div>
        </div>
      </div>
    );
  }

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = waitlistEntries?.slice(indexOfFirstItem, indexOfLastItem) || [];
  const totalPages = Math.ceil((waitlistEntries?.length || 0) / itemsPerPage);

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Waitlist Management</CardTitle>
            <CardDescription>
              Approve or manage users in the waitlist
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableCaption>
                A list of users waiting for approval to use the platform
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentItems.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{entry.name}</TableCell>
                    <TableCell>{entry.email}</TableCell>
                    <TableCell>{entry.reason || "N/A"}</TableCell>
                    <TableCell>
                      {new Date(entry.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(entry.status)}>
                        {entry.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {entry.status === "pending" && (
                        <Button
                          size="sm"
                          onClick={() => handleApprove(entry.email)}
                          disabled={approveMutation.isPending}
                        >
                          Approve
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {waitlistEntries && waitlistEntries.length > itemsPerPage && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}