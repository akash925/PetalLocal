import { useQuery } from "@tanstack/react-query";

interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  profileImageUrl?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}

export function useAuth() {
  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isFarmer: user?.role === 'farmer' || user?.role === 'grower',
    isBuyer: user?.role === 'buyer',
    error,
  };
}