import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { Response, CookieOptions } from 'express';
import { config } from '../config/env';
import { UserJWTPayload } from '../types';

export const REFRESH_COOKIE_NAME = 'velozity_refresh_token';

export const cookieOptions: CookieOptions = {
  httpOnly: true,
  secure: config.nodeEnv === 'production',
  sameSite: 'lax',
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export function signAccessToken(payload: UserJWTPayload): string {
  const options: jwt.SignOptions = {
    expiresIn: config.accessTokenExpiresIn as any,
  };
  return jwt.sign(payload, config.jwtSecret, options);
}

export function signRefreshToken(payload: { id: string }): string {
  const options: jwt.SignOptions = {
    expiresIn: config.refreshTokenExpiresIn as any,
  };
  return jwt.sign(payload, config.refreshSecret, options);
}

export function verifyAccessToken(token: string): UserJWTPayload {
  return jwt.verify(token, config.jwtSecret) as UserJWTPayload;
}

export function verifyRefreshToken(token: string): { id: string } {
  return jwt.verify(token, config.refreshSecret) as { id: string };
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function setRefreshTokenCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE_NAME, token, cookieOptions);
}

export function clearRefreshTokenCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    ...cookieOptions,
    maxAge: 0,
  });
}
