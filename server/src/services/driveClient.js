import { google } from 'googleapis';
import logger from '../utils/logger.js';

let driveClient;

export const getDriveClient = () => {
  if (driveClient) return driveClient;

  const {
    GOOGLE_OAUTH_CLIENT_ID: clientId,
    GOOGLE_OAUTH_CLIENT_SECRET: clientSecret,
    GOOGLE_OAUTH_REFRESH_TOKEN: refreshToken,
    GOOGLE_OAUTH_REDIRECT_URI: redirectUri = 'urn:ietf:wg:oauth:2.0:oob',
  } = process.env;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      'Google Drive OAuth credentials missing. Please set GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET, and GOOGLE_OAUTH_REFRESH_TOKEN.'
    );
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  driveClient = google.drive({ version: 'v3', auth: oauth2Client });
  logger.info('Google Drive client initialized with OAuth credentials');
  return driveClient;
};
