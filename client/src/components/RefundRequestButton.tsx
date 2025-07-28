import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { AlertCircle, DollarSign } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface RefundRequestButtonProps {
  orderId: number;
  orderAmount: number;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export default function RefundRequestButton({ 
  orderId, 
  orderAmount, 
  variant = "outline", 
  size = "sm",
  className = ""
}: RefundRequestButtonProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const refundMutation = useMutation({
    mutationFn: async (data: { orderId: number; amount: number; reason: string }) => {
      return apiRequest("/api/refund-requests", {
        method: "POST",
        body: data,
      });
    },
    onSuccess: () => {
      toast({
        title: "Refund Request Submitted",
        description: "Your refund request has been submitted. You'll receive an email confirmation and updates on the status.",
      });
      setOpen(false);
      setReason("");
      // Refresh order data if available
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
    },
    onError: (error: any) => {
      toast({
        title: "Request Failed",
        description: error.message || "Failed to submit refund request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!reason.trim()) {
      toast({
        title: "Reason Required",
        description: "Please provide a reason for the refund request.",
        variant: "destructive",
      });
      return;
    }

    refundMutation.mutate({
      orderId,
      amount: orderAmount,
      reason: reason.trim(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <DollarSign className="w-4 h-4 mr-2" />
          Request Refund
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <AlertCircle className="w-5 h-5 mr-2 text-orange-500" />
            Request Refund
          </DialogTitle>
          <DialogDescription>
            Order #{orderId} - ${orderAmount.toFixed(2)}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Refund Information */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-medium text-yellow-800 mb-2">Refund Process</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Your request will be reviewed by our admin team</li>
              <li>• You'll receive email updates on the status</li>
              <li>• Approved refunds are processed within 3-5 business days</li>
            </ul>
          </div>

          {/* Reason Input */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Refund Request *</Label>
            <Textarea
              id="reason"
              placeholder="Please explain why you're requesting a refund (e.g., quality issues, delivery problems, etc.)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Be specific to help us process your request quickly.
            </p>
          </div>

          {/* Submit Button */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                className="w-full" 
                disabled={!reason.trim() || refundMutation.isPending}
              >
                {refundMutation.isPending ? "Submitting..." : "Submit Refund Request"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirm Refund Request</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to request a refund of ${orderAmount.toFixed(2)} for order #{orderId}?
                  This action will notify our admin team for review.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleSubmit}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  Submit Request
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </DialogContent>
    </Dialog>
  );
}