import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MessageCircle, Send } from "lucide-react";

interface MessageFarmerButtonProps {
  farmerId: number;
  farmerName: string;
  triggerText?: string;
  variant?: "default" | "ghost" | "outline";
  size?: "sm" | "default" | "lg";
}

export function MessageFarmerButton({ 
  farmerId, 
  farmerName, 
  triggerText = "Message Farmer",
  variant = "outline",
  size = "sm"
}: MessageFarmerButtonProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");

  const sendMessageMutation = useMutation({
    mutationFn: async (data: { receiverId: number; subject?: string; content: string }) => {
      await apiRequest("POST", "/api/messages", data);
    },
    onSuccess: () => {
      toast({
        title: "Message sent",
        description: `Your message has been sent to ${farmerName}.`,
      });
      setIsOpen(false);
      setSubject("");
      setContent("");
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    if (!content.trim()) return;
    
    sendMessageMutation.mutate({
      receiverId: farmerId,
      subject: subject.trim() || undefined,
      content: content.trim(),
    });
  };

  // Don't show button if user is not authenticated or is the farmer themselves
  if (!user || user.id === farmerId) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className="gap-2">
          <MessageCircle className="w-4 h-4" />
          {triggerText}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Message {farmerName}</DialogTitle>
          <DialogDescription>
            Send a message to learn more about their produce or farming practices.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subject">Subject (optional)</Label>
            <Input
              id="subject"
              placeholder="e.g., Question about organic tomatoes"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="content">Message</Label>
            <Textarea
              id="content"
              placeholder="Hi! I'm interested in learning more about your farm and produce..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendMessage}
              disabled={!content.trim() || sendMessageMutation.isPending}
              className="bg-green-500 hover:bg-green-600"
            >
              <Send className="w-4 h-4 mr-2" />
              {sendMessageMutation.isPending ? "Sending..." : "Send Message"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}