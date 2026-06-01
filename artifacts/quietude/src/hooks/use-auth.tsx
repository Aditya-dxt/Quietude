import { createContext, useContext, useEffect, useState } from "react";
import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import type { User } from "@workspace/api-client-react/src/generated/api.schemas";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  checkAuth: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  checkAuth: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [location, setLocation] = useLocation();

  const { data: user, isLoading, refetch, isError } = useGetMe({
    query: {
      retry: false,
    }
  });

  const checkAuth = () => {
    queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
    refetch();
  };

  const logout = () => {
    queryClient.setQueryData(getGetMeQueryKey(), null);
    setLocation("/login");
  };

  // If there's an error (e.g. 401), we consider them logged out
  const activeUser = isError ? null : (user ?? null);

  return (
    <AuthContext.Provider value={{ user: activeUser, isLoading, checkAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
