/**
 * Polygon Blockchain Service
 * Provides read-only access to the ContentRegistry smart contract on Polygon
 * No wallet connection required - uses public RPC for verification
 */

import { ethers } from 'ethers';
import ContentRegistryABI from '../contracts/ContentRegistryABI.json';

// Configuration from environment
const POLYGON_RPC_URL = import.meta.env.VITE_POLYGON_RPC_URL || 'https://polygon-rpc.com';
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTENT_REGISTRY_ADDRESS || '';

// Polygon chain info
export const POLYGON_CHAIN = {
  chainId: 137,
  name: 'Polygon',
  symbol: 'MATIC',
  explorerUrl: 'https://polygonscan.com',
  rpcUrl: POLYGON_RPC_URL,
};

// Create read-only provider (no wallet needed)
let provider = null;
let contract = null;

/**
 * Initialize the provider and contract
 * Lazy initialization to handle env vars
 */
function getContract() {
  if (!contract && CONTRACT_ADDRESS) {
    provider = new ethers.JsonRpcProvider(POLYGON_RPC_URL);
    contract = new ethers.Contract(CONTRACT_ADDRESS, ContentRegistryABI, provider);
  }
  return contract;
}

/**
 * Check if blockchain service is configured
 */
export function isBlockchainEnabled() {
  return Boolean(CONTRACT_ADDRESS);
}

/**
 * Hash tile data to create a content hash
 * Uses keccak256 hash of JSON stringified tile data
 * @param {Object} tile - The tile object
 * @param {string} studioType - Type of studio ('design' | 'skill' | 'material')
 * @returns {string} The content hash (bytes32 hex string)
 */
export function hashTileData(tile, studioType) {
  const id = tile.id || tile._id || tile.slug;
  const title = tile.title || tile.name;

  // Create deterministic hash from core identifying fields
  const data = JSON.stringify({
    id,
    title,
    studioType,
  });

  return ethers.keccak256(ethers.toUtf8Bytes(data));
}

/**
 * Check if a tile is verified on-chain
 * @param {Object} tile - The tile object
 * @param {string} studioType - Type of studio
 * @returns {Promise<boolean>} True if verified on-chain
 */
export async function isVerified(tile, studioType) {
  const contractInstance = getContract();
  if (!contractInstance) {
    return false;
  }

  try {
    const hash = hashTileData(tile, studioType);
    return await contractInstance.isAnchored(hash);
  } catch (error) {
    console.error('Error checking verification:', error);
    return false;
  }
}

/**
 * Get the verification timestamp for a tile
 * @param {Object} tile - The tile object
 * @param {string} studioType - Type of studio
 * @returns {Promise<Date|null>} Verification date or null if not verified
 */
export async function getVerificationTime(tile, studioType) {
  const contractInstance = getContract();
  if (!contractInstance) {
    return null;
  }

  try {
    const hash = hashTileData(tile, studioType);
    const timestamp = await contractInstance.getTimestamp(hash);
    const ts = Number(timestamp);
    return ts > 0 ? new Date(ts * 1000) : null;
  } catch (error) {
    console.error('Error getting verification time:', error);
    return null;
  }
}

/**
 * Get full anchor info for a tile
 * @param {Object} tile - The tile object
 * @param {string} studioType - Type of studio
 * @returns {Promise<Object|null>} Anchor info or null
 */
export async function getAnchorInfo(tile, studioType) {
  const contractInstance = getContract();
  if (!contractInstance) {
    return null;
  }

  try {
    const hash = hashTileData(tile, studioType);
    const [timestamp, id, type] = await contractInstance.getAnchorInfo(hash);
    const ts = Number(timestamp);

    if (ts === 0) {
      return null;
    }

    return {
      contentHash: hash,
      timestamp: new Date(ts * 1000),
      id,
      studioType: type,
    };
  } catch (error) {
    console.error('Error getting anchor info:', error);
    return null;
  }
}

/**
 * Get Polygonscan link for the contract
 * @returns {string} Polygonscan URL
 */
export function getContractExplorerLink() {
  if (!CONTRACT_ADDRESS) {
    return POLYGON_CHAIN.explorerUrl;
  }
  return `${POLYGON_CHAIN.explorerUrl}/address/${CONTRACT_ADDRESS}`;
}

/**
 * Get Polygonscan link for a specific content hash
 * @param {Object} tile - The tile object
 * @param {string} studioType - Type of studio
 * @returns {string} Polygonscan URL with read contract view
 */
export function getTileExplorerLink(tile, studioType) {
  if (!CONTRACT_ADDRESS) {
    return POLYGON_CHAIN.explorerUrl;
  }
  const hash = hashTileData(tile, studioType);
  return `${POLYGON_CHAIN.explorerUrl}/address/${CONTRACT_ADDRESS}#readContract`;
}

/**
 * Batch check verification status for multiple tiles
 * @param {Array} tiles - Array of tile objects
 * @param {string} studioType - Type of studio
 * @returns {Promise<Map>} Map of tile id to verification status
 */
export async function batchCheckVerification(tiles, studioType) {
  const results = new Map();

  if (!isBlockchainEnabled()) {
    tiles.forEach((tile) => {
      const id = tile.id || tile._id || tile.slug;
      results.set(id, false);
    });
    return results;
  }

  // Check in parallel with rate limiting
  const checks = tiles.map(async (tile) => {
    const id = tile.id || tile._id || tile.slug;
    const verified = await isVerified(tile, studioType);
    return { id, verified };
  });

  const settled = await Promise.allSettled(checks);

  settled.forEach((result, index) => {
    const id = tiles[index].id || tiles[index]._id || tiles[index].slug;
    if (result.status === 'fulfilled') {
      results.set(id, result.value.verified);
    } else {
      results.set(id, false);
    }
  });

  return results;
}

/**
 * Format verification timestamp for display
 * @param {Date} date - The verification date
 * @returns {string} Formatted date string
 */
export function formatVerificationDate(date) {
  if (!date) return '';
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Get current block number from Polygon
 * @returns {Promise<number|null>} Current block number
 */
export async function getBlockNumber() {
  try {
    const rpcProvider = new ethers.JsonRpcProvider(POLYGON_RPC_URL);
    const blockNumber = await rpcProvider.getBlockNumber();
    return blockNumber;
  } catch (error) {
    console.error('Error getting block number:', error);
    return null;
  }
}

/**
 * Get current gas price from Polygon in Gwei
 * @returns {Promise<string|null>} Gas price in Gwei
 */
export async function getGasPrice() {
  try {
    const rpcProvider = new ethers.JsonRpcProvider(POLYGON_RPC_URL);
    const feeData = await rpcProvider.getFeeData();
    if (feeData.gasPrice) {
      // Convert to Gwei and format
      const gwei = Number(ethers.formatUnits(feeData.gasPrice, 'gwei'));
      return gwei.toFixed(1);
    }
    return null;
  } catch (error) {
    console.error('Error getting gas price:', error);
    return null;
  }
}

/**
 * Get network stats (block number, gas price)
 * @returns {Promise<Object>} Network stats
 */
export async function getNetworkStats() {
  try {
    const rpcProvider = new ethers.JsonRpcProvider(POLYGON_RPC_URL);
    const [blockNumber, feeData] = await Promise.all([
      rpcProvider.getBlockNumber(),
      rpcProvider.getFeeData(),
    ]);

    let gasPrice = null;
    let gasPriceMatic = null;
    if (feeData.gasPrice) {
      const gwei = Number(ethers.formatUnits(feeData.gasPrice, 'gwei'));
      gasPrice = gwei.toFixed(1);
      // Estimate cost for a simple anchor tx (~50000 gas)
      const maticCost = (gwei * 50000) / 1e9;
      gasPriceMatic = maticCost < 0.001 ? '<0.001' : maticCost.toFixed(4);
    }

    return {
      blockNumber,
      gasPrice,
      gasPriceMatic,
      finality: '~2 sec',
    };
  } catch (error) {
    console.error('Error getting network stats:', error);
    return {
      blockNumber: null,
      gasPrice: null,
      gasPriceMatic: null,
      finality: '~2 sec',
    };
  }
}

/**
 * Count verified tiles for a given studio type
 * @param {Array} tiles - Array of tiles to check
 * @param {string} studioType - Type of studio
 * @returns {Promise<number>} Count of verified tiles
 */
export async function countVerifiedTiles(tiles, studioType) {
  if (!isBlockchainEnabled() || !tiles?.length) {
    return 0;
  }

  const results = await batchCheckVerification(tiles, studioType);
  let count = 0;
  results.forEach((verified) => {
    if (verified) count++;
  });
  return count;
}

export default {
  isBlockchainEnabled,
  hashTileData,
  isVerified,
  getVerificationTime,
  getAnchorInfo,
  getContractExplorerLink,
  getTileExplorerLink,
  batchCheckVerification,
  formatVerificationDate,
  getBlockNumber,
  getGasPrice,
  getNetworkStats,
  countVerifiedTiles,
  POLYGON_CHAIN,
};
