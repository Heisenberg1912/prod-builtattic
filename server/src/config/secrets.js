import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import logger from '../utils/logger.js';

const parsedMapping = () => {
  const raw = process.env.SECRET_MANAGER_KEYS;
  if (!raw) {
    return [];
  }
  return raw
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [envKey, secretId] = entry.split('=').map((item) => item.trim());
      if (!envKey || !secretId) {
        throw new Error(
          `Invalid SECRET_MANAGER_KEYS entry "${entry}". Expected format ENV_NAME=secret-name-or-resource`
        );
      }
      return { envKey, secretId };
    });
};

const resolveSecretResource = (secretId) => {
  if (secretId.startsWith('projects/')) {
    return secretId.includes('/versions/')
      ? secretId
      : `${secretId}/versions/latest`;
  }

  const projectId =
    process.env.SECRET_MANAGER_PROJECT ||
    process.env.GOOGLE_CLOUD_PROJECT ||
    process.env.GCLOUD_PROJECT;

  if (!projectId) {
    throw new Error(
      `Missing SECRET_MANAGER_PROJECT or GOOGLE_CLOUD_PROJECT to resolve secret "${secretId}"`
    );
  }

  return `projects/${projectId}/secrets/${secretId}/versions/latest`;
};

let hasLoaded = false;

export const loadSecrets = async () => {
  if (hasLoaded) {
    return;
  }

  const mapping = parsedMapping();
  if (mapping.length === 0) {
    logger.debug('No SECRET_MANAGER_KEYS configured; skipping secret manager lookup');
    hasLoaded = true;
    return;
  }

  const client = new SecretManagerServiceClient();
  logger.info('Fetching secrets from Secret Manager', {
    count: mapping.length,
  });

  for (const entry of mapping) {
    if (process.env[entry.envKey]) {
      logger.debug(`Env ${entry.envKey} already set; skipping secret fetch`);
      continue;
    }

    const resource = resolveSecretResource(entry.secretId);
    try {
      const [version] = await client.accessSecretVersion({ name: resource });
      const value = version.payload?.data?.toString();
      if (!value) {
        throw new Error('Secret has no payload');
      }
      process.env[entry.envKey] = value;
      logger.info(`Loaded secret for ${entry.envKey}`);
    } catch (error) {
      logger.error('Failed to load secret', {
        envKey: entry.envKey,
        resource,
        error: error.message,
      });
      throw error;
    }
  }

  hasLoaded = true;
};
