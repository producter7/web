import { Redis } from '@upstash/redis';
import { createHmac } from 'crypto';

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

export { redis };

export async function checkPassword(password) {
  const override = await redis.get('admin_password_override');
  const correct = override || process.env.ADMIN_PASSWORD;
  return password === correct;
}

export function signToken() {
  const header  = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = b64url(JSON.stringify({
    role: 'admin',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (8 * 60 * 60)
  }));
  const sig = hmacB64url(`${header}.${payload}`, process.env.JWT_SECRET);
  return `${header}.${payload}.${sig}`;
}

export function verifyToken(req) {
  try {
    const auth  = req.headers['authorization'] || '';
    const token = auth.replace('Bearer ', '').trim();
    if (!token) return false;

    const parts = token.split('.');
    if (parts.length !== 3) return false;

    const [header, payload, sig] = parts;
    const expectedSig = hmacB64url(`${header}.${payload}`, process.env.JWT_SECRET);
    if (sig !== expectedSig) return false;

    const data = JSON.parse(
      Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString()
    );
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

function hmacB64url(data, secret) {
  const hash = createHmac('sha256', secret).update(data).digest('base64');
  return hash.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function b64url(str) {
  return Buffer.from(str).toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}
