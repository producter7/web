import { redis, verifyToken, unauthorized } from './_auth.js';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export default async function handler(req, res) {
  const { method } = req;

  if (method === 'GET') {
    const products = await redis.get('products') || [];
    return res.status(200).json(products);
  }

  if (!verifyToken(req)) return unauthorized(res);

  if (method === 'POST') {
    const products = await redis.get('products') || [];
    const product = { ...req.body, id: uid(), createdAt: Date.now() };
    products.push(product);
    await redis.set('products', products);
    return res.status(201).json(product);
  }

  if (method === 'PUT') {
    const products = await redis.get('products') || [];
    const { id } = req.query;
    const idx = products.findIndex(p => p.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    products[idx] = { ...products[idx], ...req.body, id };
    await redis.set('products', products);
    return res.status(200).json(products[idx]);
  }

  if (method === 'DELETE') {
    const products = await redis.get('products') || [];
    const { id } = req.query;
    await redis.set('products', products.filter(p => p.id !== id));
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
