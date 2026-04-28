import { kv } from '@vercel/kv';
import { verifyToken, unauthorized } from './_auth.js';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export default async function handler(req, res) {
  const { method } = req;

  // GET is public — your shop needs to read products
  if (method === 'GET') {
    const products = await kv.get('products') || [];
    return res.status(200).json(products);
  }

  // Everything else requires admin auth
  if (!verifyToken(req)) return unauthorized(res);

  if (method === 'POST') {
    const products = await kv.get('products') || [];
    const product = {
      ...req.body,
      id: uid(),
      createdAt: Date.now()
    };
    products.push(product);
    await kv.set('products', products);
    return res.status(201).json(product);
  }

  if (method === 'PUT') {
    const products = await kv.get('products') || [];
    const { id } = req.query;
    const idx = products.findIndex(p => p.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    products[idx] = { ...products[idx], ...req.body, id };
    await kv.set('products', products);
    return res.status(200).json(products[idx]);
  }

  if (method === 'DELETE') {
    const products = await kv.get('products') || [];
    const { id } = req.query;
    const filtered = products.filter(p => p.id !== id);
    await kv.set('products', filtered);
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}