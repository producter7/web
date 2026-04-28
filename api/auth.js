import { checkPassword, signToken } from './_auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { password } = req.body || {};

  if (!password) {
    return res.status(400).json({ error: 'Password required' });
  }

  const ok = await checkPassword(password);

  if (!ok) {
    await new Promise(r => setTimeout(r, 1200)); // slow brute force
    return res.status(401).json({ error: 'Incorrect password' });
  }

  const token = signToken();
  return res.status(200).json({ token });
}