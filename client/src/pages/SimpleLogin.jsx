import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import toast from "react-hot-toast";
import Footer from "../components/Footer";

export default function SimpleLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Demo login - bypasses backend for local testing
    setTimeout(() => {
      const demoUser = {
        id: "demo-user-123",
        name: email.split("@")[0] || "Demo User",
        email: email,
        role: "associate",
        fullName: email.split("@")[0] || "Demo User",
      };

      // Store in localStorage
      localStorage.setItem("auth_token", "demo-token-" + Date.now());
      localStorage.setItem("role", "associate");
      localStorage.setItem("user", JSON.stringify(demoUser));
      localStorage.setItem("auth", JSON.stringify({
        token: "demo-token-" + Date.now(),
        user: demoUser
      }));

      // Dispatch login event
      window.dispatchEvent(
        new CustomEvent("auth:login", {
          detail: { token: "demo-token", role: "associate" },
        })
      );

      setLoading(false);
      toast.success("Login successful!");

      // Redirect to dashboard
      setTimeout(() => {
        navigate("/associates/dashboard");
      }, 500);
    }, 1000);
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Card className="shadow-xl border-slate-200">
            <CardHeader>
              <CardTitle className="text-2xl text-center">
                Simple Login (Demo Mode)
              </CardTitle>
              <p className="text-sm text-slate-600 text-center mt-2">
                Enter any email to login for testing
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="demo@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter any password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="mt-2"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Demo mode - any password works
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  disabled={loading}
                >
                  {loading ? "Logging in..." : "Sign In (Demo)"}
                </Button>
              </form>

              <div className="mt-6 space-y-3">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-white px-2 text-slate-500">OR</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate("/login")}
                >
                  Use Clerk Authentication
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => navigate("/role-selection")}
                    className="text-sm text-purple-600 hover:text-purple-700"
                  >
                    New user? Select your role →
                  </button>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-800 font-semibold mb-2">
                  Demo Mode Info:
                </p>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• Enter any email and password</li>
                  <li>• Automatically logs you in as an Associate</li>
                  <li>• Perfect for testing the dashboard</li>
                  <li>• Data stored locally only</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
      <Footer />
    </>
  );
}
