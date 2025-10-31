/* global google */
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login as apiLogin, loginWithGoogle } from "../services/auth.js";
import {
  normalizeRole,
  resolveDashboardPath,
} from "../constants/roles.js";

// optional query redirect override (?redirect=/x, ?returnTo=/x, ?next=/x, ?r=/x)
function getQueryRedirect() {
  try {
    const u = new URL(window.location.href);
    const keys = ["redirect", "returnTo", "next", "r"];
    for (const k of keys) {
      const v = u.searchParams.get(k);
      if (v && v.startsWith("/")) return v;
    }
  } catch {}
  return null;
}

function resolveRedirect(role, serverPath, qsPath) {
  const q = qsPath && qsPath.startsWith("/") ? qsPath : null;
  const s = serverPath && serverPath.startsWith("/") ? serverPath : null;
  const norm = normalizeRole(role);
  return q || s || resolveDashboardPath(norm);
}

function deriveRole(user) {
  if (!user) return "user";
  if (user.role) return normalizeRole(user.role);
  const globals = user.rolesGlobal || [];
  if (globals.includes("superadmin")) return "superadmin";
  if (globals.includes("admin")) return "admin";
  const membershipRole = user.memberships?.[0]?.role;
  if (membershipRole === "owner") return "vendor";
  if (membershipRole === "admin") return "firm";
  if (membershipRole === "associate") return "associate";
  return "user";
}

const LoginPage = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const googleButtonRef = useRef(null);
  const [googleInitialized, setGoogleInitialized] = useState(false);

  const handleGoogleCredential = useCallback(async (response) => {
    try {
      if (!response?.credential) throw new Error("Google credential missing");
      const { token, user } = await loginWithGoogle(response.credential);
      if (!token) throw new Error("Invalid Google login response");
      const resolvedRole = deriveRole(user);
      const qsPath = getQueryRedirect();
      const dest = resolveRedirect(resolvedRole, null, qsPath);
      try { localStorage.setItem("auth_token", token); } catch {}
      try { localStorage.setItem("role", resolvedRole); } catch {}
      try { localStorage.setItem("user", JSON.stringify(user || {})); } catch {}
      if (typeof onLogin === "function") {
        onLogin({ token, role: resolvedRole, user, redirectPath: dest });
      }
      navigate(dest, { replace: true });
    } catch (err) {
      console.error("[GOOGLE LOGIN]", err);
      setError(err.message || "Google sign-in failed");
    }
  }, [navigate, onLogin]);

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) return;
    if (window.google?.accounts?.id) {
      setGoogleInitialized(true);
      return;
    }
    const check = () => {
      if (window.google?.accounts?.id) {
        setGoogleInitialized(true);
      } else {
        setTimeout(check, 300);
      }
    };
    check();
  }, []);

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!googleInitialized || !clientId || !googleButtonRef.current) return;
    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleCredential,
      });
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: "outline",
        size: "large",
        width: "100%",
      });
    } catch (err) {
      console.error("[GOOGLE INIT]", err);
    }
  }, [googleInitialized, handleGoogleCredential]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { token, user } = await apiLogin(email, password);
      if (!token) throw new Error("Invalid login response (missing token)");

      const resolvedRole = deriveRole(user);
      const qsPath = getQueryRedirect();
      const dest = resolveRedirect(resolvedRole, null, qsPath);

      try { localStorage.setItem("auth_token", token); } catch {}
      try { localStorage.setItem("role", resolvedRole); } catch {}
      try { localStorage.setItem("user", JSON.stringify(user || {})); } catch {}

      if (typeof onLogin === "function") {
        onLogin({ token, role: resolvedRole, user, redirectPath: dest });
      }

      navigate(dest, { replace: true });
    } catch (err) {
      console.error("[LOGIN] error", err);
      setError(err?.response?.data?.message || err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center text-[#1D1D1F] mb-8">
          Sign in to your account
        </h2>

        <form onSubmit={handleSubmit}>
          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-[#6E6E73] mb-1"
            >
              Email address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="w-full px-4 py-3 rounded-lg bg-white border border-gray-300 text-[#1D1D1F] placeholder-[#A1A1A6] focus:outline-none focus:ring-2 focus:ring-[#0071E3]"
            />
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-[#6E6E73] mb-1"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-lg bg-white border border-gray-300 text-[#1D1D1F] placeholder-[#A1A1A6] focus:outline-none focus:ring-2 focus:ring-[#0071E3]"
            />
          </div>

          {/* Error message */}
          {error && (
            <div className="text-red-500 text-sm mt-2">
              {error}
            </div>
          )}

          {/* Forgot password */}
          <div className="flex items-center justify-between text-sm">
            <Link
              to="/forgot-password"
              className="text-[#0071E3] hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          {/* Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0071E3] hover:bg-[#005BB5] disabled:opacity-50 text-white font-semibold py-3 rounded-lg shadow-md transition-colors duration-300"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {/* Divider */}
        <div className="my-6 flex items-center">
          <div className="flex-grow border-t border-gray-300"></div>
          <span className="px-3 text-[#6E6E73] text-sm">OR</span>
          <div className="flex-grow border-t border-gray-300"></div>
        </div>

        {/* Social Login */}
        <div ref={googleButtonRef} className="flex justify-center" />
        {!import.meta.env.VITE_GOOGLE_CLIENT_ID && (
          <p className="text-xs text-gray-400 mt-2 text-center">
            
          </p>
        )}

        {/* Signup link */}
        <p className="text-center text-[#6E6E73] text-sm mt-6">
          Don’t have an account?{" "}
          <Link to="/register" className="text-[#0071E3] hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
