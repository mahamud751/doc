import { Button } from "@/components/ui/Button";
import { motion } from "framer-motion";
import {
  Beaker,
  Home,
  LogOut,
  Menu,
  Pill,
  Stethoscope,
  User,
  UserCircle,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import WishlistIcon from "@/components/WishlistIcon";

interface NavigationHeaderProps {
  currentPage?: string;
}

export default function NavigationHeader({
  currentPage,
}: NavigationHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState("");
  const [userName, setUserName] = useState("");

  // Don't hide NavigationHeader anymore - show on all pages including admin dashboard

  // Check authentication status on component mount
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const role = localStorage.getItem("userRole");
    const name = localStorage.getItem("userName");

    if (token) {
      setIsLoggedIn(true);
      setUserRole(role || "");
      setUserName(name || "User");
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userName");
    setIsLoggedIn(false);
    setUserRole("");
    setUserName("");
    // Redirect to home page or login page
    window.location.href = "/";
  };

  // Navigation items
  const navItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "Medicines", href: "/medicines", icon: Pill },
    { name: "Lab Items", href: "/lab-items", icon: Beaker },
    { name: "Doctors", href: "/doctors", icon: User },
  ];

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="bg-white/95 backdrop-blur-xl border-b border-white/30 fixed top-0 left-0 right-0 z-50 shadow-lg shadow-blue-500/5"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <motion.div
            className="flex items-center space-x-3"
            whileHover={{ scale: 1.02 }}
          >
            <Link href="/">
              <div className="relative">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-2xl shadow-2xl">
                  <Stethoscope className="h-7 w-7 text-white" />
                </div>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  className="absolute -top-1 -right-1"
                >
                  <div className="h-4 w-4 text-yellow-400 drop-shadow-lg bg-yellow-400 rounded-full" />
                </motion.div>
              </div>
            </Link>
            <div>
              <Link href="/">
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  MediConnect
                </span>
              </Link>
              <p className="text-sm text-gray-600 font-medium">
                Healthcare Management
              </p>
            </div>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {/* All users including admins see the same navigation menu */}
            {navItems.map((item) => (
              <motion.div key={item.name} whileHover={{ y: -2 }}>
                <Link
                  href={item.href}
                  className={`flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition-colors font-medium relative group ${
                    currentPage === item.name.toLowerCase()
                      ? "text-blue-600 font-bold"
                      : ""
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                  {currentPage === item.name.toLowerCase() && (
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-blue-600 to-purple-600"></span>
                  )}
                  {currentPage !== item.name.toLowerCase() && (
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 transition-all group-hover:w-full"></span>
                  )}
                </Link>
              </motion.div>
            ))}

            <div className="flex items-center space-x-4 ml-6">
              {isLoggedIn ? (
                <div className="flex items-center space-x-3">
                  {userRole === "PATIENT" && <WishlistIcon />}
                  <div className="flex items-center space-x-2">
                    <UserCircle className="h-6 w-6 text-gray-600" />
                    <span className="text-gray-700 font-medium">
                      {userName}
                    </span>
                  </div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Link
                      href={
                        userRole === "PATIENT"
                          ? "/patient/dashboard"
                          : userRole === "DOCTOR"
                          ? "/doctor/dashboard"
                          : userRole === "ADMIN" || userRole === "SUPERADMIN"
                          ? "/admin/dashboard"
                          : "/dashboard"
                      }
                    >
                      <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-600 rounded-full px-6">
                        Dashboard
                      </Button>
                    </Link>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      onClick={handleLogout}
                      variant="outline"
                      className="rounded-full border-2 px-4"
                    >
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </motion.div>
                </div>
              ) : (
                <>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Link href="/auth/login">
                      <Button
                        variant="outline"
                        className="rounded-full border-2 px-6"
                      >
                        Login
                      </Button>
                    </Link>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Link href="/auth/register">
                      <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-600 rounded-full px-6">
                        Sign Up
                      </Button>
                    </Link>
                  </motion.div>
                </>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-3 rounded-2xl border border-gray-300 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all"
          >
            {isMenuOpen ? (
              <X className="w-6 h-6 text-gray-700" />
            ) : (
              <Menu className="w-6 h-6 text-gray-700" />
            )}
          </motion.button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden bg-white/95 backdrop-blur-xl border-t border-gray-200/50"
          >
            <div className="px-4 py-6 space-y-4">
              {/* All users including admins see the same navigation menu */}
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-3 py-3 font-medium transition-colors ${
                    currentPage === item.name.toLowerCase()
                      ? "text-blue-600 font-bold"
                      : "text-gray-700 hover:text-blue-600"
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              ))}

              {isLoggedIn ? (
                <div className="pt-4 border-t border-gray-200/50">
                  <div className="flex items-center space-x-2 mb-3">
                    <UserCircle className="h-5 w-5 text-gray-600" />
                    <span className="text-gray-700 font-medium">
                      {userName}
                    </span>
                  </div>
                  <Link
                    href={
                      userRole === "PATIENT"
                        ? "/patient/dashboard"
                        : userRole === "DOCTOR"
                        ? "/doctor/dashboard"
                        : userRole === "ADMIN" || userRole === "SUPERADMIN"
                        ? "/admin/dashboard"
                        : "/dashboard"
                    }
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-600 rounded-xl mb-2">
                      Dashboard
                    </Button>
                  </Link>
                  <Button
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    variant="outline"
                    className="w-full rounded-xl border-2 flex items-center justify-center"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </div>
              ) : (
                <div className="space-y-3 pt-4 border-t border-gray-200/50">
                  <Link href="/auth/login" onClick={() => setIsMenuOpen(false)}>
                    <Button
                      variant="outline"
                      className="w-full rounded-xl border-2"
                    >
                      Login
                    </Button>
                  </Link>
                  <Link
                    href="/auth/register"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-600 rounded-xl">
                      Sign Up
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </motion.nav>
  );
}
