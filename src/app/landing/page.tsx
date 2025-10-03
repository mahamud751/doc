"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import {
  Stethoscope,
  Video,
  Calendar,
  Shield,
  Clock,
  Star,
  Pill,
  FileText,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Stethoscope className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-2xl font-bold text-gray-900">
                MediConnect
              </span>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <Link
                  href="/"
                  className="text-gray-900 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Home
                </Link>
                <Link
                  href="/doctors"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Find Doctors
                </Link>
                <Link
                  href="/about"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  About
                </Link>
                <Link
                  href="/contact"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Contact
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/auth/login">
                <Button variant="outline">Login</Button>
              </Link>
              <Link href="/auth/register">
                <Button>Sign Up</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Your Health, Our <span className="text-blue-600">Priority</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Connect with qualified doctors instantly. Get consultations,
              prescriptions, and healthcare services from the comfort of your
              home.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/doctors">
                <Button size="lg" className="w-full sm:w-auto">
                  <Video className="mr-2 h-5 w-5" />
                  Book Consultation
                </Button>
              </Link>
              <Link href="/auth/register?role=doctor">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto"
                >
                  <Stethoscope className="mr-2 h-5 w-5" />
                  Join as Doctor
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose MediConnect?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Experience the future of healthcare with our comprehensive
              telemedicine platform
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Video className="h-12 w-12 text-blue-600 mb-4" />
                <CardTitle className="text-xl">Video Consultations</CardTitle>
                <CardDescription>
                  High-quality video calls with screen sharing and recording
                  capabilities
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Calendar className="h-12 w-12 text-green-600 mb-4" />
                <CardTitle className="text-xl">Easy Scheduling</CardTitle>
                <CardDescription>
                  Book appointments instantly or schedule for later with
                  flexible timing
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Pill className="h-12 w-12 text-purple-600 mb-4" />
                <CardTitle className="text-xl">Digital Prescriptions</CardTitle>
                <CardDescription>
                  Get digital prescriptions and order medicines directly from
                  pharmacy partners
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Shield className="h-12 w-12 text-red-600 mb-4" />
                <CardTitle className="text-xl">Secure & Private</CardTitle>
                <CardDescription>
                  HIPAA-compliant platform ensuring your medical data is safe
                  and confidential
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Clock className="h-12 w-12 text-orange-600 mb-4" />
                <CardTitle className="text-xl">24/7 Availability</CardTitle>
                <CardDescription>
                  Access healthcare services anytime, anywhere with our
                  round-the-clock support
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <FileText className="h-12 w-12 text-teal-600 mb-4" />
                <CardTitle className="text-xl">Medical Records</CardTitle>
                <CardDescription>
                  Maintain comprehensive digital health records accessible to
                  you and your doctors
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-white mb-2">10K+</div>
              <div className="text-blue-100">Patients Served</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white mb-2">100+</div>
              <div className="text-blue-100">Specialist Doctors</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white mb-2">99%</div>
              <div className="text-blue-100">Patient Satisfaction</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white mb-2">24/7</div>
              <div className="text-blue-100">Support Available</div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              What Our Users Say
            </h2>
            <p className="text-xl text-gray-600">
              Hear from patients and doctors who trust MediConnect
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-5 w-5 text-yellow-400 fill-current"
                    />
                  ))}
                </div>
                <p className="text-gray-600 mb-4">
                  &quot;Excellent service! The doctor was very professional and
                  the video quality was perfect. Got my prescription within
                  minutes.&quot;
                </p>
                <div className="font-semibold">Sarah Ahmed</div>
                <div className="text-sm text-gray-500">Patient</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-5 w-5 text-yellow-400 fill-current"
                    />
                  ))}
                </div>
                <p className="text-gray-600 mb-4">
                  &quot;MediConnect saved me hours of waiting. The booking
                  process is smooth and the doctors are highly qualified.&quot;
                </p>
                <div className="font-semibold">Mohammad Rahman</div>
                <div className="text-sm text-gray-500">Patient</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-5 w-5 text-yellow-400 fill-current"
                    />
                  ))}
                </div>
                <p className="text-gray-600 mb-4">
                  &quot;As a doctor, this platform helps me reach more patients
                  efficiently. The interface is intuitive and
                  feature-rich.&quot;
                </p>
                <div className="font-semibold">Dr. Fatima Khatun</div>
                <div className="text-sm text-gray-500">Cardiologist</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of patients who trust MediConnect for their
            healthcare needs
          </p>
          <Link href="/auth/register">
            <Button size="lg" variant="secondary">
              Start Your Journey
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <Stethoscope className="h-8 w-8 text-blue-400" />
                <span className="ml-2 text-2xl font-bold">MediConnect</span>
              </div>
              <p className="text-gray-400">
                Your trusted partner in digital healthcare, connecting patients
                with qualified doctors.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/doctors"
                    className="text-gray-400 hover:text-white"
                  >
                    Find Doctors
                  </Link>
                </li>
                <li>
                  <Link
                    href="/specialties"
                    className="text-gray-400 hover:text-white"
                  >
                    Specialties
                  </Link>
                </li>
                <li>
                  <Link
                    href="/about"
                    className="text-gray-400 hover:text-white"
                  >
                    About Us
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="text-gray-400 hover:text-white"
                  >
                    Contact
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">For Doctors</h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/auth/register?role=doctor"
                    className="text-gray-400 hover:text-white"
                  >
                    Join as Doctor
                  </Link>
                </li>
                <li>
                  <Link
                    href="/doctor-portal"
                    className="text-gray-400 hover:text-white"
                  >
                    Doctor Portal
                  </Link>
                </li>
                <li>
                  <Link
                    href="/resources"
                    className="text-gray-400 hover:text-white"
                  >
                    Resources
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Contact Info</h3>
              <div className="space-y-2">
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-2" />
                  <span className="text-gray-400">+880-1234-567890</span>
                </div>
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-2" />
                  <span className="text-gray-400">support@mediconnect.com</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span className="text-gray-400">Dhaka, Bangladesh</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p className="text-gray-400">
              © 2024 MediConnect. All rights reserved. | Privacy Policy | Terms
              of Service
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
