import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { Shield } from "lucide-react";

export function AdminLink() {
  const { isAdmin } = useAuth();

  if (!isAdmin) {
    return null;
  }

  return (
    <Link href="/admin" className="flex items-center space-x-1 text-sm font-medium text-gray-600 hover:text-[#0ABAB5] transition-colors">
      <Shield className="h-4 w-4" />
      <span>Admin</span>
    </Link>
  );
}