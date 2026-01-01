import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ExternalLink, Shield, ShieldCheck, Loader2 } from "lucide-react";
import { Badge } from "./ui/badge";
import {
  isVerified,
  getVerificationTime,
  getTileExplorerLink,
  formatVerificationDate,
  isBlockchainEnabled,
  POLYGON_CHAIN,
} from "../services/polygonService";

// Polygon logo SVG component
function PolygonLogo({ className = "w-4 h-4" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 38 33"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M29.034 10.268a2.15 2.15 0 0 0-2.15 0l-5.038 2.908-3.424 1.915-5.038 2.908a2.15 2.15 0 0 1-2.15 0l-3.963-2.294a2.15 2.15 0 0 1-1.075-1.859V9.358a2.15 2.15 0 0 1 1.075-1.859l3.963-2.235a2.15 2.15 0 0 1 2.15 0l3.963 2.235a2.15 2.15 0 0 1 1.075 1.86v2.907l3.424-1.974V7.384a2.15 2.15 0 0 0-1.075-1.86L14.48.937a2.15 2.15 0 0 0-2.15 0L5.91 5.524a2.15 2.15 0 0 0-1.075 1.86v9.173a2.15 2.15 0 0 0 1.075 1.86l6.42 3.718a2.15 2.15 0 0 0 2.15 0l5.037-2.848 3.424-1.974 5.037-2.849a2.15 2.15 0 0 1 2.15 0l3.964 2.235a2.15 2.15 0 0 1 1.075 1.86v4.488a2.15 2.15 0 0 1-1.075 1.86l-3.904 2.293a2.15 2.15 0 0 1-2.15 0l-3.964-2.235a2.15 2.15 0 0 1-1.075-1.86v-2.848l-3.424 1.974v2.908a2.15 2.15 0 0 0 1.075 1.86l6.42 3.717a2.15 2.15 0 0 0 2.15 0l6.42-3.717a2.15 2.15 0 0 0 1.075-1.86v-9.173a2.15 2.15 0 0 0-1.075-1.86l-6.48-3.777Z" />
    </svg>
  );
}

/**
 * PolygonVerifiedBadge - Shows blockchain verification status
 *
 * @param {Object} props
 * @param {Object} props.tile - The tile/item data
 * @param {string} props.studioType - Type: 'design' | 'skill' | 'material'
 * @param {string} props.size - Badge size: 'sm' | 'md' | 'lg'
 * @param {boolean} props.showText - Whether to show "Verified" text
 * @param {boolean} props.showExplorerLink - Whether to link to Polygonscan
 * @param {string} props.className - Additional CSS classes
 */
export default function PolygonVerifiedBadge({
  tile,
  studioType = "design",
  size = "md",
  showText = true,
  showExplorerLink = true,
  className = "",
}) {
  const [verified, setVerified] = useState(false);
  const [verifiedDate, setVerifiedDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function checkVerification() {
      if (!tile || !isBlockchainEnabled()) {
        setLoading(false);
        return;
      }

      try {
        const isVerifiedOnChain = await isVerified(tile, studioType);
        if (!mounted) return;

        setVerified(isVerifiedOnChain);

        if (isVerifiedOnChain) {
          const date = await getVerificationTime(tile, studioType);
          if (mounted) {
            setVerifiedDate(date);
          }
        }
      } catch (err) {
        console.error("Verification check failed:", err);
        if (mounted) {
          setError(true);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    checkVerification();

    return () => {
      mounted = false;
    };
  }, [tile, studioType]);

  // Size configurations
  const sizeConfig = {
    sm: {
      badge: "text-[10px] px-2 py-1 gap-1",
      icon: "w-3 h-3",
      logo: "w-3.5 h-3.5",
    },
    md: {
      badge: "text-xs px-2.5 py-1.5 gap-1.5",
      icon: "w-3.5 h-3.5",
      logo: "w-4 h-4",
    },
    lg: {
      badge: "text-sm px-3 py-2 gap-2",
      icon: "w-4 h-4",
      logo: "w-5 h-5",
    },
  };

  const config = sizeConfig[size] || sizeConfig.md;

  // Don't render if blockchain is not configured
  if (!isBlockchainEnabled()) {
    return null;
  }

  // Loading state
  if (loading) {
    return (
      <Badge
        className={`bg-purple-100/80 text-purple-600 border-purple-200/50 backdrop-blur-sm ${config.badge} ${className}`}
      >
        <Loader2 className={`${config.icon} animate-spin`} />
        {showText && <span>Web3...</span>}
      </Badge>
    );
  }

  // Error state
  if (error) {
    return null;
  }

  // Not verified state - still show web3 branding but muted
  if (!verified) {
    return (
      <Badge
        className={`bg-slate-800/80 text-slate-300 border-slate-600/50 backdrop-blur-sm ${config.badge} ${className}`}
      >
        <Shield className={config.icon} />
        {showText && <span>Web3</span>}
      </Badge>
    );
  }

  // Verified state
  const explorerLink = getTileExplorerLink(tile, studioType);

  const badgeContent = (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Badge
        className={`bg-gradient-to-r from-[#8247E5] to-[#A855F7] text-white border-0 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-105 transition-all duration-200 cursor-pointer font-semibold ${config.badge} ${className}`}
        title={
          verifiedDate
            ? `Web3 Verified on ${POLYGON_CHAIN.name} - ${formatVerificationDate(verifiedDate)}`
            : `Web3 Verified on ${POLYGON_CHAIN.name}`
        }
      >
        <PolygonLogo className={config.logo} />
        {showText && <span>Web3</span>}
        {showExplorerLink && <ExternalLink className={`${config.icon} opacity-80`} />}
      </Badge>
    </motion.div>
  );

  if (showExplorerLink && explorerLink) {
    return (
      <a
        href={explorerLink}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block"
        onClick={(e) => e.stopPropagation()}
      >
        {badgeContent}
      </a>
    );
  }

  return badgeContent;
}

/**
 * Compact version for grid tiles
 */
export function PolygonBadgeCompact({ tile, studioType, className = "" }) {
  return (
    <PolygonVerifiedBadge
      tile={tile}
      studioType={studioType}
      size="sm"
      showText={false}
      showExplorerLink={false}
      className={className}
    />
  );
}

/**
 * Hook for checking verification status
 */
export function usePolygonVerification(tile, studioType) {
  const [state, setState] = useState({
    verified: false,
    verifiedDate: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let mounted = true;

    async function check() {
      if (!tile || !isBlockchainEnabled()) {
        setState((prev) => ({ ...prev, loading: false }));
        return;
      }

      try {
        const isVerifiedOnChain = await isVerified(tile, studioType);
        if (!mounted) return;

        let date = null;
        if (isVerifiedOnChain) {
          date = await getVerificationTime(tile, studioType);
        }

        if (mounted) {
          setState({
            verified: isVerifiedOnChain,
            verifiedDate: date,
            loading: false,
            error: null,
          });
        }
      } catch (err) {
        if (mounted) {
          setState((prev) => ({
            ...prev,
            loading: false,
            error: err.message,
          }));
        }
      }
    }

    check();

    return () => {
      mounted = false;
    };
  }, [tile, studioType]);

  return state;
}
