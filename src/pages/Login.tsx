import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AuthForm from "@/components/AuthForm";
import { supabase } from "@/integrations/supabase/client";

const Login = () => {
  const navigate = useNavigate();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // Check current Supabase session
        const { data } = await supabase.auth.getSession();
        
        if (data.session) {
          // If authenticated, redirect to dashboard
          navigate("/dashboard");
        }
      } catch (error) {
        console.error("Auth check error:", error);
      } finally {
        setIsCheckingAuth(false);
      }
    };
    
    checkAuthStatus();
  }, [navigate]);
  
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-t-cancer-blue border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
        </main>
        <Footer />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      
      <main className="flex-1 flex items-center justify-center px-4 py-20">
        <div className="w-full max-w-md relative z-10">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="absolute -top-10 -left-10 w-24 h-24 rounded-full bg-gradient-to-br from-cancer-blue to-cancer-purple opacity-20 blur-xl animate-pulse"
          ></motion.div>
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="absolute -bottom-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br from-cancer-purple to-cancer-pink opacity-20 blur-xl animate-pulse"
          ></motion.div>
          
          <AuthForm isLogin />
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Login;
