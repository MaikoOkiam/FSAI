
import { useEffect, useState } from "react";
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
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";

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

  const handleApprove = (email: string) => {
    approveMutation.mutate(email);
  };

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
            
            {totalPages > 1 && (
              <Pagination className="mt-4">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <PaginationItem key={i}>
                      <PaginationLink 
                        isActive={currentPage === i + 1} 
                        onClick={() => setCurrentPage(i + 1)}
                      >
                        {i + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
