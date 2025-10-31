import Dashboard from "./pages/Dashboard"
import { useApi } from "./lib/ctx"

export default function App() {
  const { error } = useApi() || {}
  return (
    <div className="relative min-h-screen bg-base text-textPrimary transition-colors duration-300">
      {error && (
        <div className="sticky top-0 z-50 border-b border-border bg-red-500/10 px-4 py-2 text-sm text-red-400 backdrop-blur">
          {error}
        </div>
      )}
      <Dashboard />
    </div>
  )
}
