import { redis, verifyToken, unauthorized } from './_auth.js';

const DEFAULTS = {
  shopName:       'Signature Fragrances',
  heroTitle:      'Wear Your Story',
  heroSub:        'Curated fragrances that leave an impression.',
  contactTagline: "Reach out and I'll get back to you.",
  footerText:     '© 2025 Parfum. All rights reserved.'
};

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const settings = await redis.get('settings') || DEFAULTS;
    return res.status(200).json(settings);
  }

  if (!verifyToken(req)) return unauthorized(res);

  if (req.method === 'PUT') {
    const current = await redis.get('settings') || DEFAULTS;
    const updated = { ...current, ...req.body };
    await redis.set('settings', updated);
    return res.status(200).json(updated);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
