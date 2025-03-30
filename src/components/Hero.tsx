import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Activity, Search, Brain } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import CellSimulation from "./CellSimulation";

const Hero = () => {
  const navigate = useNavigate();
  const [checkingAuth, setCheckingAuth] = useState(false);

  const handleGetStarted = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    
    if (checkingAuth) return;
    
    setCheckingAuth(true);
    
    try {
      // Check current auth state with Supabase
      const { data } = await supabase.auth.getSession();
      const isAuthenticated = !!data.session;
      
      if (isAuthenticated) {
        // If already authenticated, navigate to dashboard
        navigate("/dashboard");
      } else {
        // If not authenticated, navigate to signup
        navigate("/signup");
      }
    } catch (error) {
      console.error("Auth check error:", error);
      // Default to signup on error
      navigate("/signup");
    } finally {
      setCheckingAuth(false);
    }
  };

  return (
    <section className="relative min-h-screen pt-28 pb-16 px-4 flex flex-col items-center justify-center overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-gradient-radial from-cancer-blue/10 to-transparent opacity-60"></div>
      <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-gradient-radial from-cancer-purple/10 to-transparent opacity-40"></div>
      
      <div className="max-w-7xl mx-auto w-full relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          {/* Text content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center lg:text-left"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              <span className="block">Scan, Detect, Defeat:</span>
              <span className="text-gradient bg-gradient-to-r from-cancer-blue via-cancer-purple to-cancer-pink bg-clip-text text-transparent">
                The Future of Cancer Detection!
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-gray-700 mb-8 max-w-xl mx-auto lg:mx-0">
              Experience our quirky yet powerful AI-driven platform that's revolutionizing early cancer detection with futuristic technology.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <motion.button 
                className="btn-primary flex items-center gap-2 group"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleGetStarted}
                disabled={checkingAuth}
              >
                {checkingAuth ? 'Loading...' : 'Get Started'}
                {!checkingAuth && (
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                )}
              </motion.button>
              
              <Link to="/#about">
                <motion.button 
                  className="btn-secondary"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Learn More
                </motion.button>
              </Link>
            </div>
          </motion.div>
          
          {/* Scanner illustration */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
            className="relative"
          >
            <div className="aspect-square max-w-lg mx-auto relative">
              {/* Outer glowing circle */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cancer-blue/20 to-cancer-purple/20 animate-pulse-glow"></div>
              
              {/* Scanner ring */}
              <motion.div 
                className="absolute inset-8 rounded-full border-8 border-dashed border-cancer-teal/40"
                animate={{ rotate: 360 }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
              ></motion.div>
              
              {/* Inner circle with cell simulation */}
              <div className="absolute inset-16 rounded-full bg-white/50 backdrop-blur-sm border border-white flex items-center justify-center overflow-hidden">
                {/* CellSimulation component */}
                <div className="w-full h-full flex items-center justify-center">
                  <CellSimulation width={300} height={300} />
                </div>
                
                {/* Scanning beam */}
                <div className="absolute top-0 left-0 right-0 h-1 rounded-full bg-cancer-red/50 animate-scan transform translate-y-[-50%]"></div>
              </div>
              
              {/* Floating icons */}
              <motion.div
                className="absolute top-0 right-0 w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center"
                animate={{ y: [0, -15, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
              >
                <Activity className="w-8 h-8 text-cancer-blue" />
              </motion.div>
              
              <motion.div
                className="absolute bottom-8 left-0 w-14 h-14 bg-white rounded-full shadow-lg flex items-center justify-center"
                animate={{ y: [0, 15, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
              >
                <Search className="w-7 h-7 text-cancer-purple" />
              </motion.div>
              
              <motion.div
                className="absolute top-1/4 left-0 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center"
                animate={{ x: [0, -15, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
              >
                <Brain className="w-6 h-6 text-cancer-pink" />
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
