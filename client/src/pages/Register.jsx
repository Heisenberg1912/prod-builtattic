import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { SignUp, useClerk } from "@clerk/clerk-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Sparkles, ArrowRight, Building2, Package, ShoppingBag } from "lucide-react";
import Footer from "../components/Footer";
import RegistrationBanner from "../components/RegistrationBanner";

export default function Register() {
  const navigate = useNavigate();

  // Show error if Clerk is not configured
  if (!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Configuration Required</CardTitle>
            <CardDescription>
              Clerk authentication is not configured. Please add VITE_CLERK_PUBLISHABLE_KEY to your client/.env file.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/")} className="w-full">
              Return Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const clerk = useClerk();
  const isSignedIn = clerk?.user !== null && clerk?.user !== undefined;

  // If already signed in, redirect to role selection
  React.useEffect(() => {
    if (isSignedIn) {
      navigate("/role-selection");
    }
  }, [isSignedIn, navigate]);

  return (
    <>
      {/* Registration Status Banner - Easy to customize */}
      <RegistrationBanner
        status="open"
        linkText="Sign in"
        linkTo="/login"
      />

      {/*
        Other banner variations you can use:

        // Registration Closed:
        <RegistrationBanner
          status="closed"
          linkText="Sign in"
          linkTo="/login"
        />

        // Limited Spots:
        <RegistrationBanner
          status="limited"
          message="Only 50 spots left for Associate members! Register now."
          dismissible={true}
        />

        // Custom Info:
        <RegistrationBanner
          status="info"
          message="Early access registration now open for verified professionals!"
          linkText="Learn more"
          linkTo="/about"
        />
      */}

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-2 rounded-full mb-4 shadow-lg">
              <Sparkles className="h-4 w-4" />
              <span className="font-semibold text-sm">Join Builtattic</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-2">
              Create Your Account
            </h1>
            <p className="text-lg text-slate-600">
              Start your journey with Builtattic today
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 items-start">
            {/* Clerk Sign Up Component */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="shadow-xl border-slate-200">
                <CardContent className="p-6">
                  <SignUp
                    appearance={{
                      elements: {
                        formButtonPrimary:
                          "bg-blue-600 hover:bg-blue-700 text-sm normal-case",
                        card: "shadow-none",
                        headerTitle: "hidden",
                        headerSubtitle: "hidden",
                        socialButtonsBlockButton:
                          "border-slate-300 hover:bg-slate-50",
                        formFieldInput:
                          "border-slate-300 focus:border-blue-500",
                        footerActionLink: "text-blue-600 hover:text-blue-700"
                      }
                    }}
                    routing="path"
                    path="/register"
                    signInUrl="/login"
                    afterSignUpUrl="/role-selection"
                  />
                </CardContent>
              </Card>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-center mt-4"
              >
                <p className="text-sm text-slate-600">
                  Already have an account?{" "}
                  <Link to="/login" className="text-blue-600 hover:text-blue-700 font-semibold">
                    Sign in
                  </Link>
                </p>
              </motion.div>
            </motion.div>

            {/* Benefits Section */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-6"
            >
              <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-100">
                <CardHeader>
                  <CardTitle className="text-2xl">What's Next?</CardTitle>
                  <CardDescription className="text-slate-600">
                    After registration, you'll choose your role and complete a quick onboarding
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <RoleBenefit
                    icon={Building2}
                    title="Associates"
                    description="Showcase your portfolio and connect with top firms"
                    color="from-blue-500 to-cyan-500"
                  />
                  <RoleBenefit
                    icon={Package}
                    title="Vendors"
                    description="List your materials and reach verified buyers"
                    color="from-purple-500 to-pink-500"
                  />
                  <RoleBenefit
                    icon={ShoppingBag}
                    title="Buyers"
                    description="Access quality materials and hire professionals"
                    color="from-emerald-500 to-teal-500"
                  />
                </CardContent>
              </Card>

              <Card className="border-slate-200">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                        <Sparkles className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-2">Secure & Fast</h3>
                      <p className="text-sm text-slate-600">
                        We use industry-standard authentication to keep your account secure.
                        Complete setup in under 5 minutes.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

function RoleBenefit({ icon: Icon, title, description, color }) {
  return (
    <div className="flex items-start gap-3 p-4 bg-white rounded-lg border border-slate-200">
      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center flex-shrink-0`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div>
        <h4 className="font-semibold text-slate-900 mb-1">{title}</h4>
        <p className="text-sm text-slate-600">{description}</p>
      </div>
    </div>
  );
}
