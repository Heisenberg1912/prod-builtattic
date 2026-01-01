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
      className={`rounded-2xl border border-stone-200 bg-white px-6 py-6 shadow-sm relative overflow-hidden ${className}`}
    >
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzAwMDAwMCIgc3Ryb2tlLXdpZHRoPSIwLjMiIG9wYWNpdHk9IjAuMDMiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-100" />

      <div className="relative z-10">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-stone-900 rounded-xl shadow-sm">
              <svg className="w-5 h-5 text-white" viewBox="0 0 38 33" fill="currentColor">
                <path d="M29.034 10.268a2.15 2.15 0 0 0-2.15 0l-5.038 2.908-3.424 1.915-5.038 2.908a2.15 2.15 0 0 1-2.15 0l-3.963-2.294a2.15 2.15 0 0 1-1.075-1.859V9.358a2.15 2.15 0 0 1 1.075-1.859l3.963-2.235a2.15 2.15 0 0 1 2.15 0l3.963 2.235a2.15 2.15 0 0 1 1.075 1.86v2.907l3.424-1.974V7.384a2.15 2.15 0 0 0-1.075-1.86L14.48.937a2.15 2.15 0 0 0-2.15 0L5.91 5.524a2.15 2.15 0 0 0-1.075 1.86v9.173a2.15 2.15 0 0 0 1.075 1.86l6.42 3.718a2.15 2.15 0 0 0 2.15 0l5.037-2.848 3.424-1.974 5.037-2.849a2.15 2.15 0 0 1 2.15 0l3.964 2.235a2.15 2.15 0 0 1 1.075 1.86v4.488a2.15 2.15 0 0 1-1.075 1.86l-3.904 2.293a2.15 2.15 0 0 1-2.15 0l-3.964-2.235a2.15 2.15 0 0 1-1.075-1.86v-2.848l-3.424 1.974v2.908a2.15 2.15 0 0 0 1.075 1.86l6.42 3.717a2.15 2.15 0 0 0 2.15 0l6.42-3.717a2.15 2.15 0 0 0 1.075-1.86v-9.173a2.15 2.15 0 0 0-1.075-1.86l-6.48-3.777Z" />
              </svg>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-stone-400">
                Web3 Powered
              </p>
              <p className="text-stone-900 font-semibold">{POLYGON_CHAIN.name} Network</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-stone-100 border border-stone-200 rounded-full text-stone-600 text-xs font-medium flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
              Live on Mainnet
            </span>
          </div>
        </div>

        <h2 className="text-xl font-bold text-stone-900 mb-2">{title}</h2>
        <p className="text-sm text-stone-500 mb-4">{description}</p>

        {/* Blockchain Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          <div className="bg-stone-50 rounded-xl px-4 py-3 border border-stone-100">
            <p className="text-[10px] uppercase tracking-wider text-stone-400 mb-1">{statLabel}</p>
            <p className="text-lg font-bold text-stone-900 flex items-center gap-2">
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin text-stone-400" />
              ) : (
                displayCount
              )}
            </p>
          </div>
          <div className="bg-stone-50 rounded-xl px-4 py-3 border border-stone-100">
            <p className="text-[10px] uppercase tracking-wider text-stone-400 mb-1">Block Height</p>
            <p className="text-lg font-bold text-stone-900 flex items-center gap-2">
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin text-stone-400" />
              ) : (
                formatBlockNumber(stats.blockNumber)
              )}
            </p>
          </div>
          <div className="bg-stone-50 rounded-xl px-4 py-3 border border-stone-100">
            <p className="text-[10px] uppercase tracking-wider text-stone-400 mb-1">Gas Price</p>
            <p className="text-lg font-bold text-stone-900 flex items-center gap-2">
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin text-stone-400" />
              ) : stats.gasPrice ? (
                <span>{stats.gasPrice} <span className="text-sm font-normal text-stone-500">Gwei</span></span>
              ) : (
                "—"
              )}
            </p>
          </div>
          <div className="bg-stone-50 rounded-xl px-4 py-3 border border-stone-100">
            <p className="text-[10px] uppercase tracking-wider text-stone-400 mb-1">Finality</p>
            <p className="text-lg font-bold text-stone-900">{stats.finality}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
