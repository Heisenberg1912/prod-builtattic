import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { resetPassword } from "../services/auth.js";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const initialToken = searchParams.get("token") || "";
  const [token, setToken] = useState(initialToken);
  const [tokenLocked, setTokenLocked] = useState(Boolean(initialToken));
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!token.trim()) {
      setError("Reset token is required");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      await resetPassword({ token: token.trim(), password });
      setSuccess("Your password has been updated. You can now sign in with your new password.");
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err.message || "Unable to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md space-y-6 rounded-2xl bg-white p-8 shadow-xl">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold text-slate-900">Set a new password</h1>
          <p className="text-sm text-slate-600">
            Paste the reset code from your email, then choose a new password.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {tokenLocked ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              Reset link applied from your email.
              <button
                type="button"
                onClick={() => {
                  setToken("");
                  setTokenLocked(false);
                }}
                className="ml-2 font-semibold text-emerald-700 underline-offset-2 hover:underline"
              >
                Use a different code
              </button>
            </div>
          ) : (
            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700" htmlFor="token">
                Reset token
              </label>
              <input
                id="token"
                type="text"
                required
                value={token}
                onChange={(event) => setToken(event.target.value)}
                placeholder="Paste your reset token"
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
              />
            </div>
          )}

          <div className="space-y-1">
            <label htmlFor="password" className="block text-sm font-medium text-slate-700">
              New password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Create a strong password"
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700">
              Confirm password
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Re-enter your new password"
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
            />
          </div>

          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}
          {success && (
            <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-slate-900 py-3 text-sm font-semibold text-white shadow transition hover:bg-slate-800 disabled:opacity-60"
          >
            {loading ? "Updating password..." : "Update password"}
          </button>
        </form>

        <div className="text-center text-sm text-slate-600">
          <Link to="/login" className="font-semibold text-slate-900 hover:underline">
            Return to sign in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
