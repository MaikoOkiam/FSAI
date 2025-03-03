import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Send } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function ChatAdvisor() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");

  const chatMutation = useMutation({
    mutationFn: async (prompt: string) => {
      const res = await apiRequest("POST", "/api/fashion/advice", { prompt });
      return res.json();
    },
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.advice },
      ]);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setMessages((prev) => [...prev, { role: "user", content: input }]);
    chatMutation.mutate(input);
    setInput("");
  };

  return (
    <div className="h-[600px] flex flex-col">
      <ScrollArea className="flex-1 pr-4">
        <div className="space-y-4">
          {messages.map((msg, i) => (
            <Card
              key={i}
              className={msg.role === "assistant" ? "bg-muted" : undefined}
            >
              <CardContent className="p-4">
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </CardContent>
            </Card>
          ))}
          {chatMutation.isPending && (
            <div className="flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          )}
        </div>
      </ScrollArea>

      <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Eva about fashion advice..."
          className="resize-none"
        />
        <Button
          type="submit"
          disabled={chatMutation.isPending || !input.trim()}
          size="icon"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>

      <p className="text-sm text-muted-foreground mt-2">
        Credits remaining: {user?.credits}
      </p>
    </div>
  );
}
