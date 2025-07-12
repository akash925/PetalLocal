import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ReviewFormProps {
  farmId: number;
  farmName: string;
  onReviewSubmitted?: () => void;
}

export function ReviewForm({ farmId, farmName, onReviewSubmitted }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const submitReviewMutation = useMutation({
    mutationFn: async (reviewData: { farmId: number; rating: number; comment: string }) => {
      return await apiRequest("POST", "/api/reviews", reviewData);
    },
    onSuccess: () => {
      toast({
        title: "Review Submitted",
        description: "Thank you for your feedback!",
      });
      // Reset form
      setRating(0);
      setComment("");
      // Invalidate queries to refresh farm data
      queryClient.invalidateQueries({ queryKey: [`/api/farms/${farmId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/reviews/farm/${farmId}`] });
      onReviewSubmitted?.();
    },
    onError: (error: any) => {
      console.error("Review submission error:", error);
      let errorMessage = "Failed to submit review";
      
      if (error.message) {
        if (error.message.includes("cannot review your own farm")) {
          errorMessage = "You cannot review your own farm";
        } else if (error.message.includes("500")) {
          // Parse the error from the response
          const match = error.message.match(/500:\s*({.*})/);
          if (match) {
            try {
              const errorData = JSON.parse(match[1]);
              errorMessage = errorData.error || errorMessage;
            } catch (e) {
              console.error("Error parsing error response:", e);
            }
          }
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast({
        title: "Rating Required",
        description: "Please select a star rating",
        variant: "destructive",
      });
      return;
    }
    submitReviewMutation.mutate({ farmId, rating, comment });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Write a Review</CardTitle>
        <CardDescription>Share your experience with {farmName}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Rating</Label>
            <div className="flex items-center gap-1 mt-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="focus:outline-none"
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  onClick={() => setRating(star)}
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= (hoveredRating || rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="comment" className="text-sm font-medium">
              Comment (Optional)
            </Label>
            <Textarea
              id="comment"
              placeholder="Tell others about your experience with this farm..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="mt-1"
              rows={3}
            />
          </div>

          <Button
            type="submit"
            disabled={submitReviewMutation.isPending || rating === 0}
            className="w-full"
          >
            {submitReviewMutation.isPending ? "Submitting..." : "Submit Review"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}