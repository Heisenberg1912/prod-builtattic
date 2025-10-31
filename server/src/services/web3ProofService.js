import crypto from 'node:crypto';

const chainName = process.env.BLOCKCHAIN_CHAIN_NAME || 'Polygon PoS';
const explorerBaseRaw = process.env.BLOCKCHAIN_EXPLORER_BASE_URL || 'https://polygonscan.com/tx/';
const namespace = process.env.BLOCKCHAIN_PROOF_NAMESPACE || 'builtattic-proofs';
const syncIntervalMinutes = Number(process.env.BLOCKCHAIN_SYNC_INTERVAL_MINUTES || '15') || 15;

const explorerBase = explorerBaseRaw.replace(/\/+$/, '');

const normaliseDate = (value) => {
  if (!value) return new Date();
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? new Date() : date;
};

const resolveEntityId = (entity = {}) => {
  if (!entity) return 'unknown';
  if (entity._id) return typeof entity._id === 'string' ? entity._id : entity._id.toString();
  if (entity.id) return typeof entity.id === 'string' ? entity.id : `${entity.id}`;
  if (entity.slug) return entity.slug;
  return crypto.createHash('sha256').update(JSON.stringify(entity)).digest('hex').slice(0, 24);
};

export function createWeb3Proof(entity = {}, type = 'record') {
  const entityId = resolveEntityId(entity);
  const timestamp = normaliseDate(entity.updatedAt || entity.createdAt || Date.now());
  const isoTimestamp = timestamp.toISOString();
  const digestInput = `${namespace}:${type}:${entityId}:${isoTimestamp}`;
  const proofHash = crypto.createHash('sha256').update(digestInput).digest('hex');
  const txHash = `0x${proofHash.slice(0, 64)}`;
  const anchor = `${type.toUpperCase()}-${proofHash.slice(0, 6).toUpperCase()}`;
  const explorerUrl = `${explorerBase}/${txHash}`;

  return {
    chain: chainName,
    network: chainName,
    namespace,
    type,
    entityId,
    proofHash,
    txHash,
    anchor,
    explorerUrl,
    lastSyncedAt: isoTimestamp,
    refreshInMinutes: syncIntervalMinutes,
    status: 'verified',
  };
}

export function attachWeb3Proof(entity, type) {
  if (!entity) return entity;
  const proof = createWeb3Proof(entity, type);
  if (typeof entity === 'object' && entity !== null) {
    entity.web3Proof = proof;
    return entity;
  }
  return { entity, web3Proof: proof };
}

export function summariseProofs(records = []) {
  const total = records.length;
  const anchors = records.slice(0, 5).map((record) => record.anchor);
  const latestTimestamp = records.reduce((acc, record) => {
    const timestamp = normaliseDate(record.lastSyncedAt);
    return timestamp > acc ? timestamp : acc;
  }, new Date(0));

  return {
    chain: chainName,
    namespace,
    total,
    anchors,
    lastSyncedAt: total ? latestTimestamp.toISOString() : null,
  };
}