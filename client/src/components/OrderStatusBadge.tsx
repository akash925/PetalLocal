import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, XCircle, Package, Truck, AlertTriangle, DollarSign } from "lucide-react";

interface OrderStatusBadgeProps {
  status: string;
  paymentStatus?: string;
  size?: "sm" | "default" | "lg";
}

export function OrderStatusBadge({ status, paymentStatus, size = "default" }: OrderStatusBadgeProps) {
  const getStatusConfig = () => {
    // Handle refunded orders first
    if (status === 'refunded' || paymentStatus === 'refunded') {
      return {
        variant: "secondary" as const,
        icon: DollarSign,
        text: "Refunded",
        className: "bg-gray-100 text-gray-700 border-gray-300"
      };
    }

    // Handle other statuses
    switch (status.toLowerCase()) {
      case 'pending':
        return {
          variant: "secondary" as const,
          icon: Clock,
          text: "Pending",
          className: "bg-yellow-100 text-yellow-800 border-yellow-300"
        };
      case 'confirmed':
        return {
          variant: "default" as const,
          icon: CheckCircle,
          text: "Confirmed",
          className: "bg-blue-100 text-blue-800 border-blue-300"
        };
      case 'processing':
        return {
          variant: "default" as const,
          icon: Package,
          text: "Processing",
          className: "bg-purple-100 text-purple-800 border-purple-300"
        };
      case 'shipped':
      case 'out_for_delivery':
        return {
          variant: "default" as const,
          icon: Truck,
          text: "Shipped",
          className: "bg-indigo-100 text-indigo-800 border-indigo-300"
        };
      case 'delivered':
      case 'completed':
        return {
          variant: "default" as const,
          icon: CheckCircle,
          text: "Delivered",
          className: "bg-green-100 text-green-800 border-green-300"
        };
      case 'cancelled':
        return {
          variant: "destructive" as const,
          icon: XCircle,
          text: "Cancelled",
          className: "bg-red-100 text-red-800 border-red-300"
        };
      case 'failed':
        return {
          variant: "destructive" as const,
          icon: AlertTriangle,
          text: "Failed",
          className: "bg-red-100 text-red-800 border-red-300"
        };
      default:
        return {
          variant: "outline" as const,
          icon: Clock,
          text: status.charAt(0).toUpperCase() + status.slice(1),
          className: "bg-gray-100 text-gray-700 border-gray-300"
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;
  
  const sizeClasses = {
    sm: "text-xs px-2 py-1",
    default: "text-sm px-3 py-1",
    lg: "text-base px-4 py-2"
  };

  const iconSizes = {
    sm: "w-3 h-3",
    default: "w-4 h-4", 
    lg: "w-5 h-5"
  };

  return (
    <Badge 
      variant={config.variant}
      className={`${config.className} ${sizeClasses[size]} flex items-center gap-1 font-medium`}
    >
      <Icon className={iconSizes[size]} />
      {config.text}
    </Badge>
  );
}