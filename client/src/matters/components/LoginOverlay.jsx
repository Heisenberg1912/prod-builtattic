import { useState } from "react"
import { useApi } from "../lib/ctx"

export default function LoginOverlay(){
  const { login, authLoading, authError } = useApi() || {}
  const [email, setEmail] = useState("admin@bcm.local")
  const [password, setPassword] = useState("admin")
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e)=>{
    e.preventDefault()
    setSubmitted(true)
    try{
      await login?.(email, password)
    }catch(err){
      // error handled via context state
    }finally{
      setSubmitted(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 rounded-2xl border border-border bg-surface p-6 text-textPrimary shadow-card">
        <div>
          <h2 className="text-xl font-semibold">Sign in to BCM Dashboard</h2>
          <p className="mt-1 text-sm text-textMuted">Use the seeded admin account or your own credentials.</p>
        </div>
        <label className="block text-sm text-textMuted">
          Email
          <input
            type="email"
            value={email}
            onChange={e=>setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-surfaceSoft px-3 py-2 text-textPrimary focus:outline-none focus:ring-2 focus:ring-accent"
            required
          />
        </label>
        <label className="block text-sm text-textMuted">
          Password
          <input
            type="password"
            value={password}
            onChange={e=>setPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-surfaceSoft px-3 py-2 text-textPrimary focus:outline-none focus:ring-2 focus:ring-accent"
            required
          />
        </label>
        {(authError && !authLoading) && (
          <div className="text-sm text-red-500">{authError}</div>
        )}
        <button
          type="submit"
          disabled={authLoading || submitted}
          className="w-full rounded-lg bg-accent py-2 font-semibold text-textPrimary transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {authLoading || submitted ? "Signing in..." : "Sign In"}
        </button>
        <p className="text-center text-[11px] text-textMuted">
          Demo credentials: admin@bcm.local / admin
        </p>
      </form>
    </div>
  )
}
