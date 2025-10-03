"use client";

import NavigationHeader from "@/components/NavigationHeader";
import { Button } from "@/components/ui/Button";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Award,
  Baby,
  Bone,
  Brain,
  Calendar,
  Clock,
  Droplets,
  Eye,
  FlaskConical,
  Globe,
  Heart,
  MapPin,
  MessageCircle,
  Phone,
  Pill,
  ShieldCheck,
  Smile,
  Sparkles,
  Star,
  Stethoscope,
  User,
  Users,
  Video,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function HomePage() {
  const router = useRouter();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState("");
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);

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
      icon: <User className="w-10 h-10 text-white" />,
      title: "Expert Doctors",
      description: "Connect with verified doctors across all specialties",
      link: "/doctors",
      gradient: "from-blue-500 to-cyan-500",
      bg: "from-blue-50/90 to-cyan-50/90",
    },
    {
      icon: <Video className="w-10 h-10 text-white" />,
      title: "Video Consultations",
      description: "HD video calls with real-time prescription",
      link: "/booking",
      gradient: "from-purple-500 to-pink-500",
      bg: "from-purple-50/90 to-pink-50/90",
    },
    {
      icon: <Pill className="w-10 h-10 text-white" />,
      title: "Online Pharmacy",
      description: "Order medicines with doorstep delivery",
      link: "/medicines",
      gradient: "from-green-500 to-emerald-500",
      bg: "from-green-50/90 to-emerald-50/90",
    },
    {
      icon: <FlaskConical className="w-10 h-10 text-white" />,
      title: "Lab Tests",
      description: "Book lab tests with home sample collection",
      link: "/lab-tests",
      gradient: "from-orange-500 to-amber-500",
      bg: "from-orange-50/90 to-amber-50/90",
    },
    {
      icon: <Calendar className="w-10 h-10 text-white" />,
      title: "Easy Booking",
      description: "Schedule appointments in just a few clicks",
      link: "/booking",
      gradient: "from-indigo-500 to-blue-500",
      bg: "from-indigo-50/90 to-blue-50/90",
    },
    {
      icon: <ShieldCheck className="w-10 h-10 text-white" />,
      title: "Secure & Private",
      description: "Your health data is completely secure",
      link: "#",
      gradient: "from-red-500 to-rose-500",
      bg: "from-red-50/90 to-rose-50/90",
    },
  ];

  const stats = [
    {
      number: "50,000+",
      label: "Happy Patients",
      icon: <Users className="w-8 h-8" />,
      color: "from-blue-400 to-cyan-400",
    },
    {
      number: "2,500+",
      label: "Expert Doctors",
      icon: <User className="w-8 h-8" />,
      color: "from-purple-400 to-pink-400",
    },
    {
      number: "150,000+",
      label: "Consultations",
      icon: <Video className="w-8 h-8" />,
      color: "from-green-400 to-emerald-400",
    },
    {
      number: "4.9/5",
      label: "Rating",
      icon: <Star className="w-8 h-8" />,
      color: "from-amber-400 to-orange-400",
    },
  ];

  const services = [
    {
      title: "Cardiology",
      doctors: "45+ Heart Specialists",
      image: "❤️",
      price: "From $40",
      icon: <Heart className="w-8 h-8 text-red-500" />,
      gradient: "from-red-100 to-pink-100",
    },
    {
      title: "Neurology",
      doctors: "30+ Brain Specialists",
      image: "🧠",
      price: "From $50",
      icon: <Brain className="w-8 h-8 text-purple-500" />,
      gradient: "from-purple-100 to-violet-100",
    },
    {
      title: "Orthopedics",
      doctors: "35+ Bone Specialists",
      image: "🦴",
      price: "From $45",
      icon: <Bone className="w-8 h-8 text-blue-500" />,
      gradient: "from-blue-100 to-cyan-100",
    },
    {
      title: "Pediatrics",
      doctors: "60+ Child Specialists",
      image: "👶",
      price: "From $30",
      icon: <Baby className="w-8 h-8 text-green-500" />,
      gradient: "from-green-100 to-emerald-100",
    },
    {
      title: "Dermatology",
      doctors: "40+ Skin Specialists",
      image: "🧴",
      price: "From $35",
      icon: <Droplets className="w-8 h-8 text-orange-500" />,
      gradient: "from-orange-100 to-amber-100",
    },
    {
      title: "Dental Care",
      doctors: "25+ Dentists",
      image: "🦷",
      price: "From $40",
      icon: <Smile className="w-8 h-8 text-teal-500" />,
      gradient: "from-teal-100 to-cyan-100",
    },
    {
      title: "Pulmonology",
      doctors: "20+ Lung Specialists",
      image: "🫁",
      price: "From $45",
      icon: <Eye className="w-8 h-8 text-indigo-500" />,
      gradient: "from-indigo-100 to-blue-100",
    },
    {
      title: "General Medicine",
      doctors: "120+ Physicians",
      image: "🩺",
      price: "From $25",
      icon: <Stethoscope className="w-8 h-8 text-gray-600" />,
      gradient: "from-gray-100 to-slate-100",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative overflow-hidden">
      {/* Enhanced Animated Background */}
      <div className="absolute inset-0">
        <motion.div
          animate={{
            background: [
              "radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.08) 0%, transparent 50%)",
              "radial-gradient(circle at 80% 20%, rgba(168, 85, 247, 0.08) 0%, transparent 50%)",
              "radial-gradient(circle at 40% 80%, rgba(14, 165, 233, 0.08) 0%, transparent 50%)",
              "radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.08) 0%, transparent 50%)",
            ],
          }}
          transition={{ duration: 15, repeat: Infinity }}
          className="absolute inset-0"
        />
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, 50, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-0 left-0 w-96 h-96 bg-blue-300/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, -100, 0],
            y: [0, -50, 0],
          }}
          transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-0 right-0 w-96 h-96 bg-purple-300/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, 150, 0],
            y: [0, -150, 0],
          }}
          transition={{ duration: 35, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 left-1/4 w-80 h-80 bg-cyan-300/20 rounded-full blur-3xl"
        />
      </div>

      {/* Navigation Header */}
      <NavigationHeader />

      {/* Enhanced Hero Section */}
      <section className="pt-40 pb-20 px-4 relative">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center lg:text-left"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 px-6 py-3 rounded-full mb-8 shadow-lg"
              >
                <Sparkles className="w-5 h-5" />
                <span className="font-semibold">
                  Advanced AI-Powered Healthcare Platform
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="text-5xl md:text-7xl font-bold text-gray-900 leading-tight mb-8"
              >
                Your Health,{" "}
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  Our Priority
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="text-xl text-gray-600 mb-10 leading-relaxed max-w-2xl mx-auto lg:mx-0"
              >
                Connect with expert doctors, get digital prescriptions, order
                medicines, and book lab tests - comprehensive healthcare
                solutions at your fingertips.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="flex flex-col sm:flex-row gap-5 justify-center lg:justify-start"
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    onClick={handleGetStarted}
                    size="xl"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-2xl hover:shadow-3xl transition-all rounded-full px-10 py-6 text-lg font-bold"
                  >
                    {isLoggedIn ? "Go to Dashboard" : "Get Started Free"}
                    <ArrowRight className="w-6 h-6 ml-3" />
                  </Button>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link href="/doctors">
                    <Button
                      variant="outline"
                      size="xl"
                      className="border-2 border-gray-300 hover:border-blue-500 rounded-full px-10 py-6 text-lg font-bold"
                    >
                      Find Doctors
                    </Button>
                  </Link>
                </motion.div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="mt-12 flex flex-wrap items-center justify-center lg:justify-start gap-8 text-base text-gray-600"
              >
                {[
                  {
                    icon: ShieldCheck,
                    text: "Verified Doctors",
                    color: "text-green-500",
                  },
                  {
                    icon: Clock,
                    text: "24/7 Available",
                    color: "text-blue-500",
                  },
                  {
                    icon: Award,
                    text: "Trusted by 50k+",
                    color: "text-yellow-500",
                  },
                ].map((item, index) => (
                  <div key={index} className="flex items-center">
                    <item.icon className={`w-6 h-6 ${item.color} mr-3`} />
                    <span className="font-semibold">{item.text}</span>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="relative"
            >
              {/* Enhanced Animated Card with Bubbles */}
              <div className="relative z-10 bg-gradient-to-br from-white/90 via-blue-50/50 to-purple-50/50 backdrop-blur-xl rounded-3xl shadow-2xl p-6 border border-white/30 max-w-md mx-auto lg:mx-0">
                {/* Animated Bubbles */}
                <motion.div
                  animate={{
                    y: [0, -10, 0],
                    x: [0, 5, 0],
                    scale: [1, 1.05, 1],
                  }}
                  transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="absolute top-4 right-4 w-8 h-8 bg-blue-400/20 rounded-full blur-sm"
                />
                <motion.div
                  animate={{
                    y: [0, 10, 0],
                    x: [0, -5, 0],
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 1,
                  }}
                  className="absolute bottom-6 left-6 w-6 h-6 bg-purple-400/20 rounded-full blur-sm"
                />
                <motion.div
                  animate={{
                    y: [0, -8, 0],
                    x: [0, 8, 0],
                    scale: [1, 1.08, 1],
                  }}
                  transition={{
                    duration: 7,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 2,
                  }}
                  className="absolute top-10 left-8 w-4 h-4 bg-indigo-400/20 rounded-full blur-sm"
                />

                <div className="text-center mb-6 relative z-10">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className="bg-gradient-to-r from-blue-500 to-purple-500 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl"
                  >
                    <Heart className="w-8 h-8 text-white" />
                  </motion.div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    Quick Health Checkup
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Instant consultation booking
                  </p>
                </div>

                <div className="space-y-4 relative z-10">
                  {[
                    {
                      icon: Video,
                      title: "Video Consultation",
                      desc: "30 min session",
                      price: "$25",
                    },
                    {
                      icon: MessageCircle,
                      title: "Chat Consultation",
                      desc: "Unlimited messages",
                      price: "$15",
                    },
                  ].map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + index * 0.1 }}
                      whileHover={{ scale: 1.02, y: -3 }}
                      className="flex items-center justify-between p-4 bg-gradient-to-r from-white/80 to-blue-50/30 rounded-xl cursor-pointer transition-all shadow-md hover:shadow-lg border border-white/50 backdrop-blur-sm"
                    >
                      <div className="flex items-center">
                        <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-2 rounded-lg mr-4 shadow-md">
                          <item.icon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">
                            {item.title}
                          </p>
                          <p className="text-gray-600 text-sm">{item.desc}</p>
                        </div>
                      </div>
                      <span className="text-blue-600 font-bold">
                        {item.price}
                      </span>
                    </motion.div>
                  ))}

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 mt-4 rounded-xl py-3 text-base font-bold shadow-xl hover:shadow-2xl transition-all">
                      Book Instant Consultation
                    </Button>
                  </motion.div>
                </div>
              </div>

              {/* Floating elements */}
              <motion.div
                animate={{
                  y: [0, -15, 0],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute -top-4 -right-4 bg-white rounded-2xl shadow-2xl p-4 border border-gray-200/50 backdrop-blur-sm"
              >
                <div className="flex items-center">
                  <div className="bg-gradient-to-r from-green-400 to-emerald-500 p-2 rounded-lg mr-3 shadow-md">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">24/7</p>
                    <p className="text-xs text-gray-600">Availability</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                animate={{
                  y: [0, 15, 0],
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1,
                }}
                className="absolute -bottom-4 -left-4 bg-white rounded-2xl shadow-2xl p-4 border border-gray-200/50 backdrop-blur-sm"
              >
                <div className="flex items-center">
                  <div className="bg-gradient-to-r from-blue-400 to-cyan-500 p-2 rounded-lg mr-3 shadow-md">
                    <Globe className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">150+</p>
                    <p className="text-xs text-gray-600">Countries</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Enhanced Stats Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full">
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{ duration: 8, repeat: Infinity }}
              className="absolute top-0 left-0 w-80 h-80 bg-white/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"
            />
            <motion.div
              animate={{
                scale: [1.2, 1, 1.2],
                opacity: [0.4, 0.2, 0.4],
              }}
              transition={{ duration: 10, repeat: Infinity }}
              className="absolute bottom-0 right-0 w-80 h-80 bg-white/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"
            />
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center text-white"
              >
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="flex justify-center mb-5"
                >
                  <div
                    className={`bg-gradient-to-r ${stat.color} p-4 rounded-2xl shadow-2xl backdrop-blur-sm`}
                  >
                    {stat.icon}
                  </div>
                </motion.div>
                <div className="text-4xl md:text-5xl font-bold mb-3 drop-shadow-lg">
                  {stat.number}
                </div>
                <div className="text-blue-100/90 text-lg font-medium">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Features Section */}
      <section className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-4xl md:text-5xl font-bold text-gray-900 mb-6"
            >
              Complete Healthcare{" "}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Ecosystem
              </span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed"
            >
              From virtual consultations to medicine delivery, we provide
              end-to-end healthcare solutions designed for modern living
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ y: -15, scale: 1.03 }}
                onHoverStart={() => setHoveredFeature(index)}
                onHoverEnd={() => setHoveredFeature(null)}
                className="bg-white/80 backdrop-blur-sm border border-white/30 rounded-3xl shadow-2xl p-8 cursor-pointer group transition-all duration-500 hover:shadow-3xl relative overflow-hidden"
                onClick={() => router.push(feature.link)}
              >
                {/* Animated gradient background */}
                <motion.div
                  className={`absolute inset-0 bg-gradient-to-r ${feature.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                  animate={{
                    opacity: hoveredFeature === index ? 1 : 0,
                  }}
                />

                {/* Icon container */}
                <motion.div
                  className={`relative z-10 mb-6 bg-gradient-to-r ${feature.gradient} p-4 rounded-2xl shadow-lg w-16 h-16 flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
                  whileHover={{ rotate: [0, -5, 5, 0] }}
                  transition={{ duration: 0.5 }}
                >
                  {feature.icon}
                </motion.div>

                <div className="relative z-10">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-gray-800 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    {feature.description}
                  </p>
                  <motion.div
                    className="flex items-center text-blue-600 font-semibold text-lg"
                    whileHover={{ x: 5 }}
                  >
                    <span>Explore</span>
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Services Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50/50 via-purple-50/50 to-indigo-50/50 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-4xl md:text-5xl font-bold text-gray-900 mb-6"
            >
              Medical{" "}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Specialties
              </span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="text-xl text-gray-600 max-w-2xl mx-auto"
            >
              Comprehensive healthcare services across all major medical
              specialties
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ y: -10, scale: 1.05 }}
                className="bg-white/80 backdrop-blur-sm border border-white/30 rounded-3xl p-6 shadow-2xl cursor-pointer group transition-all duration-500 hover:shadow-3xl relative overflow-hidden"
              >
                {/* Background gradient */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${service.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                />

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-4xl group-hover:scale-110 transition-transform duration-300">
                      {service.image}
                    </div>
                    <motion.div
                      whileHover={{ scale: 1.2, rotate: 360 }}
                      transition={{ duration: 0.5 }}
                    >
                      {service.icon}
                    </motion.div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-gray-800">
                    {service.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4 group-hover:text-gray-700">
                    {service.doctors}
                  </p>
                  <p className="text-blue-600 font-bold text-lg group-hover:text-blue-700">
                    {service.price}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced CTA Section */}
      <section className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-4xl p-16 text-center relative overflow-hidden shadow-2xl">
            {/* Animated background elements */}
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.1, 0.2, 0.1],
              }}
              transition={{ duration: 6, repeat: Infinity }}
              className="absolute -top-32 -right-32 w-64 h-64 bg-white/10 rounded-full blur-3xl"
            />
            <motion.div
              animate={{
                scale: [1.1, 1, 1.1],
                opacity: [0.15, 0.1, 0.15],
              }}
              transition={{ duration: 8, repeat: Infinity }}
              className="absolute -bottom-32 -left-32 w-64 h-64 bg-white/10 rounded-full blur-3xl"
            />

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative z-10"
            >
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="text-4xl md:text-6xl font-bold text-white mb-6"
              >
                Start Your Health Journey
                <span className="block text-3xl md:text-4xl text-blue-100 mt-4">
                  Today!
                </span>
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="text-xl mb-12 text-blue-100/90 max-w-2xl mx-auto leading-relaxed"
              >
                Join 50,000+ satisfied patients who trust MediConnect for their
                comprehensive healthcare needs and experience the future of
                medicine
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  onClick={handleGetStarted}
                  size="xl"
                  className="bg-white text-blue-600 hover:bg-gray-100 text-xl font-bold rounded-full px-12 py-6 shadow-2xl hover:shadow-3xl transition-all"
                >
                  {isLoggedIn ? "Go to Dashboard" : "Get Started Free Today"}
                  <ArrowRight className="w-6 h-6 ml-3" />
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Enhanced Footer */}
      <footer className="bg-white/80 backdrop-blur-xl border-t border-gray-200/50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                className="flex items-center space-x-3 mb-6"
              >
                <div className="relative">
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-2xl shadow-lg">
                    <Stethoscope className="w-7 h-7 text-white" />
                  </div>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 12,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="absolute -top-1 -right-1"
                  >
                    <Sparkles className="w-3 h-3 text-yellow-400" />
                  </motion.div>
                </div>
                <div>
                  <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    MediConnect
                  </span>
                  <p className="text-xs text-gray-600 font-medium">
                    Healthcare Excellence
                  </p>
                </div>
              </motion.div>
              <p className="text-gray-600 leading-relaxed">
                Your trusted partner for comprehensive, AI-powered healthcare
                solutions. Transforming healthcare delivery through innovation
                and compassion.
              </p>
            </div>

            {[
              {
                title: "Quick Links",
                links: [
                  "Find Doctors",
                  "Book Appointment",
                  "Medicines",
                  "Lab Tests",
                ],
              },
              {
                title: "Support",
                links: [
                  "Help Center",
                  "Contact Us",
                  "Privacy Policy",
                  "Terms of Service",
                ],
              },
              {
                title: "Contact Info",
                items: [
                  { icon: Phone, text: "+1 (555) 123-4567" },
                  { icon: MapPin, text: "123 Health St, Medical City" },
                  { icon: Clock, text: "24/7 Available" },
                ],
              },
            ].map((section, index) => (
              <div key={index}>
                <h3 className="font-bold text-gray-900 text-lg mb-6">
                  {section.title}
                </h3>
                {section.links ? (
                  <div className="space-y-4">
                    {section.links.map((link) => (
                      <Link
                        key={link}
                        href={`/${link.toLowerCase().replace(" ", "-")}`}
                        className="block text-gray-600 hover:text-blue-600 transition-colors font-medium"
                      >
                        {link}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4 text-gray-600">
                    {section.items?.map((item, itemIndex) => (
                      <div key={itemIndex} className="flex items-start">
                        <item.icon className="w-5 h-5 mr-4 mt-1 text-blue-600" />
                        <span className="font-medium">{item.text}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="border-t border-gray-200/50 mt-12 pt-8 text-center text-gray-600">
            <p>
              &copy; 2025 MediConnect. All rights reserved. Transforming
              healthcare through innovation.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
