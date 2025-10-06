import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_CONFIG } from "@/config/api";

interface User {
  id: string;
  account_id: string;
  email: string;
  full_name: string;
  role: string;
  last_login: string | null;
  is_active: boolean;
}

interface AuthContextType {
  user: User | null;
  accountId: string | null;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string, accountName: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for existing user data in localStorage
    const checkExistingAuth = () => {
      try {
        const storedUser = localStorage.getItem('user');
        const storedAccountId = localStorage.getItem('account_id');
        
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          setAccountId(storedAccountId || userData.account_id);
        }
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('account_id');
      } finally {
        setLoading(false);
      }
    };

    checkExistingAuth();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.LOGIN}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setUser(data.user);
        setAccountId(data.user.account_id);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('account_id', data.user.account_id);
        return { error: null };
      } else {
        return { error: { message: data.message || "Failed to sign in" } };
      }
    } catch (error) {
      return { error: { message: "Network error. Please try again." } };
    }
  };

  const signUp = async (email: string, password: string, fullName: string, accountName: string) => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SIGNUP}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          full_name: fullName,
          account_name: accountName
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        return { error: null };
      } else {
        return { error: { message: data.message || "Failed to create account" } };
      }
    } catch (error) {
      return { error: { message: "Network error. Please try again." } };
    }
  };

  const signOut = async () => {
    setUser(null);
    setAccountId(null);
    localStorage.removeItem('user');
    localStorage.removeItem('account_id');
    navigate("/auth");
  };

  return (
    <AuthContext.Provider
      value={{ user, accountId, signIn, signUp, signOut, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
