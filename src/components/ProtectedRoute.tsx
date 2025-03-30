import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const location = useLocation();

  useEffect(() => {
    let mounted = true;
    let authTimeout: NodeJS.Timeout;
    
    const checkSession = async () => {
      try {
        // First try to get session from existing state
        const { data: { session } } = await supabase.auth.getSession();
        
        if (mounted) {
          setIsAuthenticated(!!session);
          setIsCheckingAuth(false);
          
          if (!session) {
            toast({
              title: "Authentication Required",
              description: "Please log in to access this page.",
              variant: "destructive",
            });
          }
        }
      } catch (error) {
        console.error("Session check error:", error);
        if (mounted) {
          setIsAuthenticated(false);
          setIsCheckingAuth(false);
        }
      }
    };
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("Auth state changed:", event, !!session);
        
        // Clear any pending timeout to prevent race conditions
        if (authTimeout) {
          clearTimeout(authTimeout);
        }
        
        // Add a small debounce to prevent rapid state changes
        authTimeout = setTimeout(() => {
          if (mounted) {
            setIsAuthenticated(!!session);
            setIsCheckingAuth(false);
          }
        }, 300);
      }
    );

    // Initial session check
    checkSession();

    return () => {
      mounted = false;
      if (authTimeout) {
        clearTimeout(authTimeout);
      }
      subscription.unsubscribe();
    };
  }, [location.pathname]); // Re-check when path changes

  // Show loading state while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-50">
        <div className="animate-pulse-glow w-16 h-16 rounded-full bg-cancer-blue/10 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-cancer-blue/20 animate-pulse"></div>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Render children if authenticated
  return <>{children}</>;
};

export default ProtectedRoute;
