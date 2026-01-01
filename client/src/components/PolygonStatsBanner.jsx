import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import {
  getNetworkStats,
  countVerifiedTiles,
  isBlockchainEnabled,
  POLYGON_CHAIN,
} from "../services/polygonService";

/**
 * Format block number for display (e.g., 67234567 -> "67.2M")
 */
function formatBlockNumber(num) {
  if (!num) return "—";
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1)}K`;
  }
  return num.toString();
}

/**
 * PolygonStatsBanner - Displays real-time blockchain stats
 *
 * @param {Object} props
 * @param {Array} props.tiles - Array of tiles to count verified items
 * @param {string} props.studioType - Type: 'design' | 'skill' | 'material'
 * @param {string} props.title - Banner title
 * @param {string} props.description - Banner description
 * @param {string} props.statLabel - Label for the count stat (e.g., "Tiles On-Chain")
 * @param {string} props.className - Additional CSS classes
 */
export default function PolygonStatsBanner({
  tiles = [],
  studioType = "design",
  title = "Design Tiles Anchored On-Chain",
  description = "Each tile is cryptographically hashed and anchored to the Polygon blockchain for immutable provenance tracking.",
  statLabel = "Tiles On-Chain",
  className = "",
}) {
  const [stats, setStats] = useState({
    blockNumber: null,
    gasPrice: null,
    gasPriceMatic: null,
    finality: "~2 sec",
  });
  const [verifiedCount, setVerifiedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function fetchStats() {
      setLoading(true);
      try {
        // Fetch network stats
        const networkStats = await getNetworkStats();
        if (mounted) {
          setStats(networkStats);
        }

        // Count verified tiles if blockchain is enabled
        if (isBlockchainEnabled() && tiles.length > 0) {
          const count = await countVerifiedTiles(tiles, studioType);
          if (mounted) {
            setVerifiedCount(count);
          }
        }
      } catch (error) {
        console.error("Failed to fetch blockchain stats:", error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchStats();

    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [tiles, studioType]);

  // Display total tiles if blockchain not configured, otherwise show verified count
  const displayCount = isBlockchainEnabled() ? verifiedCount : tiles.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border border-purple-500/30 bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 px-6 py-6 shadow-xl relative overflow-hidden ${className}`}
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#8247E5]/30 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-[#A855F7]/20 to-transparent rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzgyNDdFNSIgc3Ryb2tlLXdpZHRoPSIwLjUiIG9wYWNpdHk9IjAuMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-50" />

      <div className="relative z-10">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-[#8247E5] to-[#A855F7] rounded-xl shadow-lg shadow-purple-500/30">
              <svg className="w-5 h-5 text-white" viewBox="0 0 38 33" fill="currentColor">
                <path d="M29.034 10.268a2.15 2.15 0 0 0-2.15 0l-5.038 2.908-3.424 1.915-5.038 2.908a2.15 2.15 0 0 1-2.15 0l-3.963-2.294a2.15 2.15 0 0 1-1.075-1.859V9.358a2.15 2.15 0 0 1 1.075-1.859l3.963-2.235a2.15 2.15 0 0 1 2.15 0l3.963 2.235a2.15 2.15 0 0 1 1.075 1.86v2.907l3.424-1.974V7.384a2.15 2.15 0 0 0-1.075-1.86L14.48.937a2.15 2.15 0 0 0-2.15 0L5.91 5.524a2.15 2.15 0 0 0-1.075 1.86v9.173a2.15 2.15 0 0 0 1.075 1.86l6.42 3.718a2.15 2.15 0 0 0 2.15 0l5.037-2.848 3.424-1.974 5.037-2.849a2.15 2.15 0 0 1 2.15 0l3.964 2.235a2.15 2.15 0 0 1 1.075 1.86v4.488a2.15 2.15 0 0 1-1.075 1.86l-3.904 2.293a2.15 2.15 0 0 1-2.15 0l-3.964-2.235a2.15 2.15 0 0 1-1.075-1.86v-2.848l-3.424 1.974v2.908a2.15 2.15 0 0 0 1.075 1.86l6.42 3.717a2.15 2.15 0 0 0 2.15 0l6.42-3.717a2.15 2.15 0 0 0 1.075-1.86v-9.173a2.15 2.15 0 0 0-1.075-1.86l-6.48-3.777Z" />
              </svg>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-purple-400">
                Web3 Powered
              </p>
              <p className="text-white font-semibold">{POLYGON_CHAIN.name} Network</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full text-green-400 text-xs font-medium flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
              Live on Mainnet
            </span>
          </div>
        </div>

        <h2 className="text-xl font-bold text-white mb-2">{title}</h2>
        <p className="text-sm text-purple-200/80 mb-4">{description}</p>

        {/* Blockchain Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/10">
            <p className="text-[10px] uppercase tracking-wider text-purple-400 mb-1">{statLabel}</p>
            <p className="text-lg font-bold text-white flex items-center gap-2">
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
              ) : (
                displayCount
              )}
            </p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/10">
            <p className="text-[10px] uppercase tracking-wider text-purple-400 mb-1">Block Height</p>
            <p className="text-lg font-bold text-white flex items-center gap-2">
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
              ) : (
                formatBlockNumber(stats.blockNumber)
              )}
            </p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/10">
            <p className="text-[10px] uppercase tracking-wider text-purple-400 mb-1">Gas Price</p>
            <p className="text-lg font-bold text-white flex items-center gap-2">
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
              ) : stats.gasPrice ? (
                <span>{stats.gasPrice} <span className="text-sm font-normal text-purple-300">Gwei</span></span>
              ) : (
                "—"
              )}
            </p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/10">
            <p className="text-[10px] uppercase tracking-wider text-purple-400 mb-1">Finality</p>
            <p className="text-lg font-bold text-white">{stats.finality}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
