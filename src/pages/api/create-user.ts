import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// Use your Supabase service role key here
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let body = req.body;
  // If body is a string, parse it as JSON
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (err) {
      return res.status(400).json({ error: 'Invalid JSON format' });
    }
  }

  const { name, email, password, address, role } = body;

  try {
    // Create user with admin privileges
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name, address }
    });
    if (error) {
      console.error('Supabase error:', error);
      return res.status(400).json({ error: error.message || 'Supabase error' });
    }

    // Optionally set role in your user_roles table
    if (role && role !== 'normal_user' && data && data.user && data.user.id) {
      const { error: roleError } = await supabase
        .from('user_roles')
        .update({ role })
        .eq('user_id', data.user.id);
      if (roleError) {
        console.error('Role update error:', roleError);
        return res.status(400).json({ error: roleError.message || 'Role update error' });
      }
    }

    // Only send serializable user data
    return res.status(200).json({ success: true, user: data && data.user ? {
      id: data.user.id,
      email: data.user.email,
      user_metadata: data.user.user_metadata
    } : null });
  } catch (err: any) {
    console.error('API error:', err);
    try {
      return res.status(400).json({ error: err && err.message ? err.message : 'Unknown error' });
    } catch (jsonErr) {
      // Fallback: always send a valid JSON string
      res.setHeader('Content-Type', 'application/json');
      res.status(400).end('{"error":"Critical API error"}');
    }
  }
}
