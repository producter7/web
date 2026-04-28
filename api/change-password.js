import { kv } from '@vercel/kv';
import { verifyToken, unauthorized, checkPassword } from './_auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!verifyToken(req)) return unauthorized(res);

  const { currentPassword, newPassword } = req.body || {};

  const ok = await checkPassword(currentPassword);
  if (!ok) {
    return res.status(401).json({ error: 'Current password is wrong' });
  }

  if (!newPassword || newPassword.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  await kv.set('admin_password_override', newPassword);
  return res.status(200).json({ ok: true });
}