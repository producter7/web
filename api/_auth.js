import { kv } from '@vercel/kv';

const JWT_SECRET = process.env.JWT_SECRET;

export async function checkPassword(password) {
  // Check if admin has changed password via the app
  // If yes, that overrides the env var
  const override = await kv.get('admin_password_override');
  const correct = override || process.env.ADMIN_PASSWORD;
  return password === correct;
}

export function signToken() {
  // Manual JWT — no dependency needed
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = b64url(JSON.stringify({
    role: 'admin',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (8 * 60 * 60) // 8 hours
  }));
  const sig = b64url(hmacSha256(`${header}.${payload}`, JWT_SECRET));
  return `${header}.${payload}.${sig}`;
}

export function verifyToken(req) {
  try {
    const auth = req.headers['authorization'] || '';
    const token = auth.replace('Bearer ', '').trim();
    if (!token) return false;

    const parts = token.split('.');
    if (parts.length !== 3) return false;

    const [header, payload, sig] = parts;

    // Verify signature
    const expectedSig = b64url(hmacSha256(`${header}.${payload}`, JWT_SECRET));
    if (sig !== expectedSig) return false;

    // Verify expiry
    const data = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    if (data.exp < Math.floor(Date.now() / 1000)) return false;
    if (data.role !== 'admin') return false;

    return true;
  } catch {
    return false;
  }
}

export function unauthorized(res) {
  return res.status(401).json({ error: 'Unauthorized' });
}

// ── JWT helpers (no external crypto lib needed in Node 18+) ──
import { createHmac } from 'crypto';

function hmacSha256(data, secret) {
  return createHmac('sha256', secret).update(data).digest('base64');
}

function b64url(str) {
  // If already base64 (from hmac digest), just make it url-safe
  // If it's a plain string, encode it first
  const b64 = Buffer.isBuffer(str)
    ? str.toString('base64')
    : Buffer.from(str).toString('base64');
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}