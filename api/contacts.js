import { kv } from '@vercel/kv';
import { verifyToken, unauthorized } from './_auth.js';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export default async function handler(req, res) {
  const { method } = req;

  if (method === 'GET') {
    const contacts = await kv.get('contacts') || [];
    return res.status(200).json(contacts);
  }

  if (!verifyToken(req)) return unauthorized(res);

  if (method === 'POST') {
    const contacts = await kv.get('contacts') || [];
    const contact = { ...req.body, id: uid() };
    contacts.push(contact);
    await kv.set('contacts', contacts);
    return res.status(201).json(contact);
  }

  if (method === 'DELETE') {
    const contacts = await kv.get('contacts') || [];
    const { id } = req.query;
    const filtered = contacts.filter(c => c.id !== id);
    await kv.set('contacts', filtered);
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}