"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Stethoscope,
  Phone,
  MapPin,
  Clock,
  Star,
  ShieldCheck,
  Heart,
  Users,
  Award,
  ArrowRight,
  Menu,
  X,
  Calendar,
  Video,
  Pill,
  FlaskConical,
  User,
  Activity,
  Search,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const role = localStorage.getItem("userRole");
    if (token) {
      setIsLoggedIn(true);
      setUserRole(role || "");
    }
  }, []);

  const handleGetStarted = () => {
    if (isLoggedIn) {
      switch (userRole) {
        case "PATIENT":
          router.push("/patient/dashboard");
          break;
        case "DOCTOR":
          router.push("/doctor/dashboard");
          break;
        case "ADMIN":
        case "SUPERADMIN":
          router.push("/admin/dashboard");
          break;
        default:
          router.push("/auth/login");
      }
    } else {
      router.push("/auth/register");
    }
  };

  const features = [
    {
      icon: <User className="w-8 h-8 text-blue-600" />,
      title: "Expert Doctors",
      description: "Connect with verified doctors across all specialties",
      link: "/doctors",
    },
    {
      icon: <Video className="w-8 h-8 text-green-600" />,
      title: "Video Consultations",
      description: "HD video calls with real-time prescription",
      link: "/booking",
    },
    {
      icon: <Pill className="w-8 h-8 text-purple-600" />,
      title: "Online Pharmacy",
      description: "Order medicines with doorstep delivery",
      link: "/medicines",
    },
    {
      icon: <FlaskConical className="w-8 h-8 text-red-600" />,
      title: "Lab Tests",
      description: "Book lab tests with home sample collection",
      link: "/lab-tests",
    },
    {
      icon: <Calendar className="w-8 h-8 text-yellow-600" />,
      title: "Easy Booking",
      description: "Schedule appointments in just a few clicks",
      link: "/booking",
    },
    {
      icon: <ShieldCheck className="w-8 h-8 text-indigo-600" />,
      title: "Secure & Private",
      description: "Your health data is completely secure",
      link: "#",
    },
  ];

  const stats = [
    {
      number: "10,000+",
      label: "Happy Patients",
      icon: <Users className="w-6 h-6" />,
    },
    {
      number: "500+",
      label: "Expert Doctors",
      icon: <User className="w-6 h-6" />,
    },
    {
      number: "50,000+",
      label: "Consultations",
      icon: <Video className="w-6 h-6" />,
    },
    { number: "4.8", label: "Rating", icon: <Star className="w-6 h-6" /> },
  ];

  const services = [
    {
      title: "General Medicine",
      doctors: "120+ Doctors",
      image: "🩺",
      price: "From $25",
    },
    {
      title: "Cardiology",
      doctors: "45+ Doctors",
      image: "❤️",
      price: "From $40",
    },
    {
      title: "Dermatology",
      doctors: "30+ Doctors",
      image: "🧴",
      price: "From $35",
    },
    {
      title: "Pediatrics",
      doctors: "60+ Doctors",
      image: "👶",
      price: "From $30",
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-b z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-2"
            >
              <div className="bg-blue-600 p-2 rounded-lg">
                <Stethoscope className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">
                MediConnect
              </span>
            </motion.div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link
                href="/doctors"
                className="text-gray-700 hover:text-blue-600 transition-colors"
              >
                Doctors
              </Link>
              <Link
                href="/medicines"
                className="text-gray-700 hover:text-blue-600 transition-colors"
              >
                Medicines
              </Link>
              <Link
                href="/lab-tests"
                className="text-gray-700 hover:text-blue-600 transition-colors"
              >
                Lab Tests
              </Link>
              <Link
                href="/about"
                className="text-gray-700 hover:text-blue-600 transition-colors"
              >
                About
              </Link>
              {isLoggedIn ? (
                <Button
                  onClick={handleGetStarted}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Dashboard
                </Button>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link href="/auth/login">
                    <Button variant="outline">Login</Button>
                  </Link>
                  <Link href="/auth/register">
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      Sign Up
                    </Button>
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2"
            >
              {isMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden bg-white border-t"
          >
            <div className="px-4 py-6 space-y-4">
              <Link
                href="/doctors"
                className="block text-gray-700 hover:text-blue-600"
              >
                Doctors
              </Link>
              <Link
                href="/medicines"
                className="block text-gray-700 hover:text-blue-600"
              >
                Medicines
              </Link>
              <Link
                href="/lab-tests"
                className="block text-gray-700 hover:text-blue-600"
              >
                Lab Tests
              </Link>
              <Link
                href="/about"
                className="block text-gray-700 hover:text-blue-600"
              >
                About
              </Link>
              {!isLoggedIn && (
                <div className="space-y-2 pt-4 border-t">
                  <Link href="/auth/login">
                    <Button variant="outline" className="w-full">
                      Login
                    </Button>
                  </Link>
                  <Link href="/auth/register">
                    <Button className="w-full bg-blue-600 hover:bg-blue-700">
                      Sign Up
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-12 bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 leading-tight">
                Your Health, <span className="text-blue-600">Our Priority</span>
              </h1>
              <p className="text-xl text-gray-600 mt-6 leading-relaxed">
                Connect with expert doctors, get prescriptions, order medicines,
                and book lab tests - all from the comfort of your home.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={handleGetStarted}
                  className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-3"
                >
                  {isLoggedIn ? "Go to Dashboard" : "Get Started"}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Link href="/doctors">
                  <Button
                    variant="outline"
                    className="text-lg px-8 py-3 w-full sm:w-auto"
                  >
                    Find Doctors
                  </Button>
                </Link>
              </div>
              <div className="mt-8 flex items-center space-x-6 text-sm text-gray-600">
                <div className="flex items-center">
                  <ShieldCheck className="w-5 h-5 text-green-500 mr-2" />
                  Verified Doctors
                </div>
                <div className="flex items-center">
                  <Clock className="w-5 h-5 text-blue-500 mr-2" />
                  24/7 Available
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="bg-white rounded-2xl shadow-xl p-8 border">
                <div className="text-center mb-6">
                  <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Heart className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Quick Health Checkup
                  </h3>
                  <p className="text-gray-600">Book your consultation now</p>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">Video Consultation</span>
                    <span className="text-blue-600 font-semibold">$25</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">Chat Consultation</span>
                    <span className="text-blue-600 font-semibold">$15</span>
                  </div>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    Book Now
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center text-white"
              >
                <div className="flex justify-center mb-2">{stat.icon}</div>
                <div className="text-2xl md:text-3xl font-bold">
                  {stat.number}
                </div>
                <div className="text-blue-100">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need for Better Health
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From consultations to medicines, we provide comprehensive
              healthcare solutions at your fingertips
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer group"
                onClick={() => router.push(feature.link)}
              >
                <div className="mb-4 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Popular Specialties
            </h2>
            <p className="text-xl text-gray-600">
              Choose from our wide range of medical specialties
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all cursor-pointer group"
              >
                <div className="text-4xl mb-4">{service.image}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {service.title}
                </h3>
                <p className="text-sm text-gray-600 mb-2">{service.doctors}</p>
                <p className="text-blue-600 font-semibold">{service.price}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-white"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Start Your Health Journey?
            </h2>
            <p className="text-xl mb-8 text-blue-100">
              Join thousands of satisfied patients who trust MediConnect for
              their healthcare needs
            </p>
            <Button
              onClick={handleGetStarted}
              className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-3"
            >
              {isLoggedIn ? "Go to Dashboard" : "Get Started Today"}
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="bg-blue-600 p-2 rounded-lg">
                  <Stethoscope className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold">MediConnect</span>
              </div>
              <p className="text-gray-400">
                Your trusted partner for comprehensive healthcare solutions.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <div className="space-y-2">
                <Link
                  href="/doctors"
                  className="block text-gray-400 hover:text-white"
                >
                  Find Doctors
                </Link>
                <Link
                  href="/booking"
                  className="block text-gray-400 hover:text-white"
                >
                  Book Appointment
                </Link>
                <Link
                  href="/medicines"
                  className="block text-gray-400 hover:text-white"
                >
                  Medicines
                </Link>
                <Link
                  href="/lab-tests"
                  className="block text-gray-400 hover:text-white"
                >
                  Lab Tests
                </Link>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <div className="space-y-2">
                <Link
                  href="/help"
                  className="block text-gray-400 hover:text-white"
                >
                  Help Center
                </Link>
                <Link
                  href="/contact"
                  className="block text-gray-400 hover:text-white"
                >
                  Contact Us
                </Link>
                <Link
                  href="/privacy"
                  className="block text-gray-400 hover:text-white"
                >
                  Privacy Policy
                </Link>
                <Link
                  href="/terms"
                  className="block text-gray-400 hover:text-white"
                >
                  Terms of Service
                </Link>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Contact Info</h3>
              <div className="space-y-2 text-gray-400">
                <div className="flex items-center">
                  <Phone className="w-4 h-4 mr-2" />
                  +1 (555) 123-4567
                </div>
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-2" />
                  123 Health St, Medical City
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 MediConnect. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
