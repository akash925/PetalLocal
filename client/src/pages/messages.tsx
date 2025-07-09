import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Send, User, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Message } from "@shared/schema";

export default function Messages() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [messageContent, setMessageContent] = useState("");
  const [messageSubject, setMessageSubject] = useState("");

  // Get user's messages
  const { data: messages = [], isLoading } = useQuery<Message[]>({
    queryKey: ["/api/messages"],
    enabled: !!user,
  });

  // Get unread message count
  const { data: unreadCount = { count: 0 } } = useQuery({
    queryKey: ["/api/messages/unread-count"],
    enabled: !!user,
  });

  // Get conversation with selected user
  const { data: conversation = [] } = useQuery<Message[]>({
    queryKey: ["/api/messages/conversation", selectedConversation],
    enabled: !!selectedConversation,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { receiverId: number; subject?: string; content: string }) => {
      await apiRequest("POST", "/api/messages", data);
    },
    onSuccess: () => {
      toast({
        title: "Message sent",
        description: "Your message has been sent successfully.",
      });
      setMessageContent("");
      setMessageSubject("");
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages/conversation", selectedConversation] });
    },
    onError: (error) => {
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mark message as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (messageId: number) => {
      await apiRequest("PUT", `/api/messages/${messageId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages/unread-count"] });
    },
  });

  // Get unique conversations
  const conversations = messages.reduce((acc: { [key: number]: Message[] }, message) => {
    const otherUserId = message.senderId === user?.id ? message.receiverId : message.senderId;
    if (!acc[otherUserId]) {
      acc[otherUserId] = [];
    }
    acc[otherUserId].push(message);
    return acc;
  }, {});

  const handleSendMessage = () => {
    if (!selectedConversation || !messageContent.trim()) return;
    
    sendMessageMutation.mutate({
      receiverId: selectedConversation,
      subject: messageSubject.trim() || undefined,
      content: messageContent.trim(),
    });
  };

  const handleMarkAsRead = (messageId: number) => {
    markAsReadMutation.mutate(messageId);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">Please log in to view your messages.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Messages</h1>
          <p className="text-gray-600">
            Communicate with farmers and buyers
            {unreadCount.count > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount.count} unread
              </Badge>
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Conversations List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Conversations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                {Object.entries(conversations).length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No conversations yet
                  </div>
                ) : (
                  Object.entries(conversations).map(([userId, userMessages]) => {
                    const latestMessage = userMessages[0];
                    const otherUserId = parseInt(userId);
                    const unreadInConversation = userMessages.filter(
                      msg => msg.receiverId === user.id && !msg.isRead
                    ).length;

                    return (
                      <div
                        key={userId}
                        className={`p-3 rounded-lg cursor-pointer border mb-2 ${
                          selectedConversation === otherUserId
                            ? "bg-green-50 border-green-200"
                            : "bg-white border-gray-200 hover:bg-gray-50"
                        }`}
                        onClick={() => setSelectedConversation(otherUserId)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-500" />
                            <span className="font-medium">
                              User {userId}
                            </span>
                          </div>
                          {unreadInConversation > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {unreadInConversation}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1 truncate">
                          {latestMessage.content}
                        </p>
                        <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          {formatDistanceToNow(new Date(latestMessage.createdAt), { addSuffix: true })}
                        </div>
                      </div>
                    );
                  })
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Conversation View */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>
                {selectedConversation ? `Conversation with User ${selectedConversation}` : "Select a conversation"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedConversation ? (
                <div className="space-y-4">
                  {/* Messages */}
                  <ScrollArea className="h-96 p-4 border rounded-lg">
                    {conversation.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        No messages in this conversation yet
                      </div>
                    ) : (
                      conversation.map((message) => (
                        <div
                          key={message.id}
                          className={`mb-4 ${
                            message.senderId === user.id ? "text-right" : "text-left"
                          }`}
                        >
                          <div
                            className={`inline-block p-3 rounded-lg max-w-xs ${
                              message.senderId === user.id
                                ? "bg-green-500 text-white"
                                : "bg-gray-200 text-gray-800"
                            }`}
                          >
                            {message.subject && (
                              <div className="font-semibold text-sm mb-1">
                                {message.subject}
                              </div>
                            )}
                            <div>{message.content}</div>
                            <div className="text-xs opacity-75 mt-1">
                              {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                            </div>
                          </div>
                          {message.receiverId === user.id && !message.isRead && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMarkAsRead(message.id)}
                              className="mt-1"
                            >
                              Mark as read
                            </Button>
                          )}
                        </div>
                      ))
                    )}
                  </ScrollArea>

                  {/* Send Message Form */}
                  <div className="space-y-3">
                    <Input
                      placeholder="Subject (optional)"
                      value={messageSubject}
                      onChange={(e) => setMessageSubject(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Textarea
                        placeholder="Type your message..."
                        value={messageContent}
                        onChange={(e) => setMessageContent(e.target.value)}
                        className="flex-1"
                        rows={3}
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={!messageContent.trim() || sendMessageMutation.isPending}
                        className="bg-green-500 hover:bg-green-600"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  Select a conversation to start messaging
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}