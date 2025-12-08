import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { SignIn, useClerk } from "@clerk/clerk-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Sparkles, CheckCircle } from "lucide-react";
import Footer from "../components/Footer";

export default function Login() {
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

  // If already signed in, redirect to home or dashboard
  React.useEffect(() => {
    if (isSignedIn) {
      navigate("/");
    }
  }, [isSignedIn, navigate]);

  const benefits = [
    "Access to exclusive marketplace",
    "Connect with verified professionals",
    "Track all your projects in one place",
    "Secure payment processing",
    "24/7 customer support"
  ];

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white px-6 py-2 rounded-full mb-4 shadow-lg">
              <Sparkles className="h-4 w-4" />
              <span className="font-semibold text-sm">Welcome Back</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-2">
              Sign In to Builtattic
            </h1>
            <p className="text-lg text-slate-600">
              Continue your journey with us
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 items-start">
            {/* Clerk Sign In Component */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="shadow-xl border-slate-200">
                <CardContent className="p-6">
                  <SignIn
                    appearance={{
                      elements: {
                        formButtonPrimary:
                          "bg-purple-600 hover:bg-purple-700 text-sm normal-case",
                        card: "shadow-none",
                        headerTitle: "hidden",
                        headerSubtitle: "hidden",
                        socialButtonsBlockButton:
                          "border-slate-300 hover:bg-slate-50",
                        formFieldInput:
                          "border-slate-300 focus:border-purple-500",
                        footerActionLink: "text-purple-600 hover:text-purple-700"
                      }
                    }}
                    routing="path"
                    path="/login"
                    signUpUrl="/register"
                    afterSignInUrl="/"
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
                  Don't have an account?{" "}
                  <Link to="/register" className="text-purple-600 hover:text-purple-700 font-semibold">
                    Sign up
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
              <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-100">
                <CardContent className="p-6">
                  <h3 className="text-2xl font-bold text-slate-900 mb-4">
                    Why Builtattic?
                  </h3>
                  <ul className="space-y-3">
                    {benefits.map((benefit, index) => (
                      <motion.li
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + index * 0.1 }}
                        className="flex items-start gap-3"
                      >
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-slate-700">{benefit}</span>
                      </motion.li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100">
                <CardContent className="p-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-slate-900 mb-2">10,000+</div>
                    <p className="text-slate-600 mb-4">
                      Professionals and businesses trust Builtattic
                    </p>
                    <div className="flex justify-center gap-4 text-sm text-slate-500">
                      <div>
                        <div className="font-semibold text-slate-900">500+</div>
                        <div>Associates</div>
                      </div>
                      <div className="border-l border-slate-300"></div>
                      <div>
                        <div className="font-semibold text-slate-900">200+</div>
                        <div>Vendors</div>
                      </div>
                      <div className="border-l border-slate-300"></div>
                      <div>
                        <div className="font-semibold text-slate-900">5000+</div>
                        <div>Buyers</div>
                      </div>
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
