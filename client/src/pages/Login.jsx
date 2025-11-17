/* global google */
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login as passwordLogin, loginWithGoogle } from "../services/auth.js";
import { normalizeRole, resolveDashboardPath, inferRoleFromUser } from "../constants/roles.js";

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

const LOGIN_COPY = {
  badge: "Builtattic",
  heading: "Sign in to Builtattic",
  description: "Access your marketplace account, wishlist, saved studios, and orders.",
  helper: "Roles are determined by your account—no manual switching needed.",
};

const LoginPage = ({ onLogin }) => {
  const navigate = useNavigate();
  const roleCopy = LOGIN_COPY;

  const completeLogin = useCallback(
    ({ token, user, role, dashboardPath }) => {
      if (!token || !user) {
        throw new Error("Invalid login response (missing session)");
      }
      const resolvedRole = inferRoleFromUser(user) || role || "user";
      const qsPath = getQueryRedirect();
      const dest = resolveRedirect(resolvedRole, dashboardPath, qsPath);
      try {
        localStorage.setItem("auth_token", token);
        localStorage.setItem("role", resolvedRole);
        localStorage.setItem("user", JSON.stringify(user));
      } catch {}
      if (typeof onLogin === "function") {
        onLogin({ token, role: resolvedRole, user, redirectPath: dest });
      }
      navigate(dest, { replace: true });
    },
    [navigate, onLogin]
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const googleButtonRef = useRef(null);
  const [googleInitialized, setGoogleInitialized] = useState(false);

  const handleGoogleCredential = useCallback(async (response) => {
    try {
      if (!response?.credential) throw new Error("Google credential missing");
      const { token, user } = await loginWithGoogle(response.credential);
      if (!token) throw new Error("Invalid Google login response");
      const resolvedRole = inferRoleFromUser(user) || "user";
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
        width: 320,
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
      const data = await passwordLogin(email, password);
      completeLogin({
        token: data.token,
        user: data.user,
        role: data.role || data.user?.role,
        dashboardPath: data.dashboardPath,
      });
    } catch (err) {
      console.error("[LOGIN] error", err);
      setError(err?.response?.data?.error || err?.response?.data?.message || err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-2xl rounded-3xl bg-white p-8 shadow-xl">
        <div className="text-center mb-6">
          <span className="mx-auto mb-3 inline-flex items-center rounded-full bg-[#EEF2FF] px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[#4338CA]">
            {roleCopy.badge}
          </span>
          <h2 className="text-3xl font-bold text-[#1D1D1F] mb-2">{roleCopy.heading}</h2>
          <p className="text-sm text-[#6E6E73]">{roleCopy.description}</p>
          <p className="text-xs text-[#9F9FA3] mt-1">
            Sign in once and we'll route you to the correct workspace automatically.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
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

          {error && (
            <div className="text-red-500 text-sm mt-2">{error}</div>
          )}

          <div className="flex items-center justify-between text-sm">
            <Link to="/forgot-password" className="text-[#0071E3] hover:underline">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0071E3] hover:bg-[#005BB5] disabled:opacity-50 text-white font-semibold py-3 rounded-lg shadow-md transition-colors duration-300"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="my-6 flex items-center">
          <div className="flex-grow border-t border-gray-300"></div>
          <span className="px-3 text-[#6E6E73] text-sm">OR</span>
          <div className="flex-grow border-t border-gray-300"></div>
        </div>

        {Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID) ? (
          <div ref={googleButtonRef} className="flex justify-center" />
        ) : (
          <p className="text-xs text-gray-400 mt-2 text-center">
            Add <code>VITE_GOOGLE_CLIENT_ID</code> to your environment to enable Google sign-in.
          </p>
        )}
        {roleCopy?.helper && (
          <p className="mt-4 text-center text-sm text-[#6E6E73]">
            {roleCopy.helper}
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
