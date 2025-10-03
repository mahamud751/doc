"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Menu, X, ChevronDown, User, Settings, LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  title?: string;
  showHeader?: boolean;
  showSidebar?: boolean;
  user?: {
    name: string;
    email: string;
    role: string;
    avatar?: string;
  };
}

interface NavigationItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
  children?: NavigationItem[];
}

const defaultNavigation: NavigationItem[] = [
  {
    label: "Dashboard",
    href: "/admin/dashboard",
  },
  {
    label: "Lab Tests",
    href: "/lab-tests",
  },
  {
    label: "Lab Packages",
    href: "/lab-packages",
  },
  {
    label: "Appointments",
    href: "/appointments",
  },
  {
    label: "Orders",
    href: "/orders",
    children: [
      { label: "Medicine Orders", href: "/orders/medicines" },
      { label: "Lab Orders", href: "/orders/lab-tests" },
    ],
  },
  {
    label: "Reviews",
    href: "/reviews",
  },
  {
    label: "Reports",
    href: "/reports",
  },
];

// Simplified navigation for admin users - Empty to remove all sidebar navigation
const adminNavigation: NavigationItem[] = [];

export default function ResponsiveLayout({
  children,
  title = "Medical Management",
  showHeader = true,
  showSidebar = true,
  user,
}: ResponsiveLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const router = useRouter();

  // Determine if user is admin and should get simplified navigation
  const isAdmin = user?.role === "ADMIN";
  const navigation = isAdmin ? adminNavigation : defaultNavigation;
  // For admin users, don't show sidebar at all
  const shouldShowSidebar = showSidebar && !isAdmin;

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const toggleExpanded = (label: string) => {
    setExpandedItems((prev) =>
      prev.includes(label)
        ? prev.filter((item) => item !== label)
        : [...prev, label]
    );
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  const renderNavigationItem = (item: NavigationItem, level = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.label);

    return (
      <div key={item.label} className={`${level > 0 ? "ml-4" : ""}`}>
        <div className="flex items-center">
          {hasChildren ? (
            <button
              onClick={() => toggleExpanded(item.label)}
              className={`
                w-full flex items-center justify-between px-3 py-2 rounded-lg text-left
                hover:bg-white/10 transition-colors duration-200
                ${level > 0 ? "text-sm" : ""}
              `}
            >
              <span className="flex items-center">
                {item.icon && <span className="mr-3">{item.icon}</span>}
                {item.label}
              </span>
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 ${
                  isExpanded ? "rotate-180" : ""
                }`}
              />
            </button>
          ) : (
            <Link
              href={item.href}
              className={`
                w-full block px-3 py-2 rounded-lg hover:bg-white/10 
                transition-colors duration-200
                ${level > 0 ? "text-sm" : ""}
              `}
              onClick={() => isMobile && setIsSidebarOpen(false)}
            >
              <span className="flex items-center">
                {item.icon && <span className="mr-3">{item.icon}</span>}
                {item.label}
              </span>
            </Link>
          )}
        </div>

        {hasChildren && isExpanded && (
          <div className="mt-1 space-y-1">
            {item.children!.map((child) =>
              renderNavigationItem(child, level + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      {showHeader && (
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                {shouldShowSidebar && (
                  <button
                    onClick={toggleSidebar}
                    className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  >
                    <Menu className="w-6 h-6" />
                  </button>
                )}
                <h1 className="ml-2 md:ml-0 text-xl font-semibold text-gray-900 truncate">
                  {title}
                </h1>
              </div>

              {user && (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="hidden sm:block text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {user.name}
                      </p>
                      <p className="text-xs text-gray-500">{user.role}</p>
                    </div>
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                      {user.avatar ? (
                        <Image
                          src={user.avatar}
                          alt={`${user.name}'s avatar`}
                          width={32}
                          height={32}
                          className="rounded-full"
                        />
                      ) : (
                        <User className="w-4 h-4 text-white" />
                      )}
                    </div>
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                      <Link
                        href="/profile"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <User className="w-4 h-4 mr-3" />
                        Profile
                      </Link>
                      <Link
                        href="/settings"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <Settings className="w-4 h-4 mr-3" />
                        Settings
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <LogOut className="w-4 h-4 mr-3" />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>
      )}

      <div className="flex">
        {/* Sidebar */}
        {shouldShowSidebar && (
          <>
            {/* Mobile overlay */}
            {isMobile && isSidebarOpen && (
              <div
                className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
                onClick={() => setIsSidebarOpen(false)}
              />
            )}

            {/* Sidebar */}
            <aside
              className={`
                fixed md:static inset-y-0 left-0 z-40 w-64 bg-gradient-to-b from-blue-600 to-blue-800 text-white
                transform transition-transform duration-300 ease-in-out md:transform-none
                ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
                ${showHeader ? "top-16 md:top-0" : "top-0"}
              `}
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-bold">Medical System</h2>
                  {isMobile && (
                    <button
                      onClick={() => setIsSidebarOpen(false)}
                      className="p-1 rounded text-white hover:bg-white/10"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>

                <nav className="space-y-2">
                  {navigation.map((item) => renderNavigationItem(item))}
                </nav>
              </div>
            </aside>
          </>
        )}

        {/* Main content */}
        <main
          className={`
          flex-1 min-h-screen
          ${shouldShowSidebar ? "md:ml-0" : ""}
          ${showHeader ? "pt-0" : "pt-16"}
        `}
        >
          <div
            className={isAdmin ? "px-4 sm:px-6 lg:px-8" : "p-4 sm:p-6 lg:p-8"}
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

// Responsive utility hooks
export const useBreakpoint = () => {
  const [breakpoint, setBreakpoint] = useState("desktop");

  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      if (width < 640) setBreakpoint("mobile");
      else if (width < 768) setBreakpoint("sm");
      else if (width < 1024) setBreakpoint("md");
      else if (width < 1280) setBreakpoint("lg");
      else setBreakpoint("xl");
    };

    updateBreakpoint();
    window.addEventListener("resize", updateBreakpoint);
    return () => window.removeEventListener("resize", updateBreakpoint);
  }, []);

  return breakpoint;
};

export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return isMobile;
};
