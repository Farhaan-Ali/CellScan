import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Menu, X, UserCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    // Check auth status when component mounts and on location change
    const checkAuthStatus = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        setIsLoggedIn(!!data.session);
      } catch (error) {
        console.error("Auth check error in Navbar:", error);
        setIsLoggedIn(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsLoggedIn(!!session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [location.pathname]);

  const links = [
    { name: "Home", path: "/" },
    { name: "About", path: "/#about" },
    { name: "Features", path: "/#features" },
    { name: "How It Works", path: "/#how-it-works" },
    { name: "P5 Demo", path: "/p5-demo" },
  ];

  const variants = {
    open: { opacity: 1, x: 0 },
    closed: { opacity: 0, x: "100%" },
  };

  return (
    <nav className="w-full fixed top-0 left-0 right-0 z-50 px-6 py-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center glassmorphism px-4 py-2 rounded-xl">
          <Link to="/" className="flex items-center space-x-2">
            <motion.div
              className="w-10 h-10 rounded-full bg-gradient-to-br from-cancer-blue to-cancer-purple flex items-center justify-center"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <span className="text-white font-bold text-lg">CS</span>
            </motion.div>
            <span className="text-xl font-exo font-bold text-cancer-dark">
              Cell<span className="text-cancer-blue">Scan</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <ul className="flex space-x-6">
              {links.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className={`relative font-medium text-gray-700 hover:text-cancer-blue transition-colors group ${
                      location.pathname === link.path ? "text-cancer-blue" : ""
                    }`}
                  >
                    {link.name}
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-cancer-blue group-hover:w-full transition-all duration-300"></span>
                  </Link>
                </li>
              ))}
            </ul>

            <div className="flex items-center space-x-3">
              {isLoading ? (
                <div className="w-24 h-10 animate-pulse bg-gray-100 rounded-lg"></div>
              ) : isLoggedIn ? (
                <div className="flex space-x-3">
                  <Link to="/quiz">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="py-2 px-4 rounded-lg border border-cancer-blue text-cancer-blue hover:bg-cancer-blue/10 transition-colors"
                    >
                      Take Quiz
                    </motion.button>
                  </Link>
                  <Link to="/dashboard">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center space-x-2 py-2 px-4 rounded-lg bg-cancer-blue/10 text-cancer-blue hover:bg-cancer-blue/20 transition-colors"
                    >
                      <UserCircle size={18} />
                      <span>Dashboard</span>
                    </motion.button>
                  </Link>
                </div>
              ) : (
                <>
                  <Link to="/login">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="py-2 px-4 rounded-lg border border-cancer-blue text-cancer-blue hover:bg-cancer-blue/10 transition-colors"
                    >
                      Log In
                    </motion.button>
                  </Link>
                  <Link to="/signup">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="py-2 px-4 rounded-lg bg-cancer-blue text-white hover:bg-cancer-teal transition-colors shadow-lg hover:shadow-cancer-blue/20"
                    >
                      Sign Up
                    </motion.button>
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg bg-cancer-blue/10 text-cancer-blue hover:bg-cancer-blue/20 transition-colors"
            >
              {isOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <motion.div
          className="md:hidden fixed top-20 right-0 h-screen w-64 bg-white shadow-lg z-50 rounded-l-xl border-l border-t border-b border-cancer-blue/20"
          animate={isOpen ? "open" : "closed"}
          variants={variants}
          initial="closed"
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          <div className="p-4 flex flex-col h-full">
            <ul className="flex flex-col space-y-4 mb-8">
              {links.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className={`block py-2 px-4 rounded-lg ${
                      location.pathname === link.path
                        ? "bg-cancer-blue/10 text-cancer-blue"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="flex flex-col space-y-3 mt-auto mb-10">
              {isLoading ? (
                <div className="w-full h-10 animate-pulse bg-gray-100 rounded-lg"></div>
              ) : isLoggedIn ? (
                <>
                  <Link
                    to="/quiz"
                    onClick={() => setIsOpen(false)}
                  >
                    <button className="w-full py-2 px-4 rounded-lg border border-cancer-blue text-cancer-blue hover:bg-cancer-blue/10 transition-colors">
                      Take Quiz
                    </button>
                  </Link>
                  <Link
                    to="/dashboard"
                    onClick={() => setIsOpen(false)}
                  >
                    <button className="w-full py-2 px-4 rounded-lg bg-cancer-blue/10 text-cancer-blue hover:bg-cancer-blue/20 transition-colors flex items-center justify-center space-x-2">
                      <UserCircle size={18} />
                      <span>Dashboard</span>
                    </button>
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setIsOpen(false)}
                  >
                    <button className="w-full py-2 px-4 rounded-lg border border-cancer-blue text-cancer-blue hover:bg-cancer-blue/10 transition-colors">
                      Log In
                    </button>
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setIsOpen(false)}
                  >
                    <button className="w-full py-2 px-4 rounded-lg bg-cancer-blue text-white hover:bg-cancer-teal transition-colors">
                      Sign Up
                    </button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </nav>
  );
};

export default Navbar;
