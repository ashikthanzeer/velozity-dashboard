import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

const envFileCandidates = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), 'server/.env'),
  path.resolve(__dirname, '../../.env'),
  path.resolve(__dirname, '../../../.env'),
];

for (const envPath of envFileCandidates) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
}

dotenv.config();

function firstNonEmpty(...values: Array<string | undefined>): string | undefined {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) {
      return trimmed;
    }
  }
  return undefined;
}

const databaseUrl =
  firstNonEmpty(
    process.env.DATABASE_URL,
    process.env.POSTGRES_PRISMA_URL,
    process.env.POSTGRES_URL,
    process.env.DATABASE_PRIVATE_URL,
    process.env.DATABASE_INTERNAL_URL
  ) || 'postgresql://postgres:postgrespassword@localhost:5432/velozity_db?schema=public';

process.env.DATABASE_URL = databaseUrl;

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl,
  jwtSecret: process.env.JWT_SECRET || 'velozity_jwt_access_secret_super_secure_key_2026_prod',
  refreshSecret: process.env.REFRESH_SECRET || 'velozity_jwt_refresh_secret_super_secure_key_2026_prod',
  accessTokenExpiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || '15m',
  refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
};
