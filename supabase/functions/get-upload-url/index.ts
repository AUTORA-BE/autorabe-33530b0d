/**
 * get-upload-url — issues a short-lived signed URL for client uploads.
 *
 * Flow:
 *   1. Authenticate the caller (JWT).
 *   2. Server-side validate bucket, mime type, size, and target folder.
 *   3. Rate-limit per user (max 30 uploads / 10 min).
 *   4. Return { uploadUrl, path, token } — the client uploads with PUT.
 *
 * Why not direct uploads?  The bucket policy already restricts mime + size,
 * but going through this function gives us:
 *   - one place to enforce business rules (e.g. ban .heic, scan filename)
 *   - rate-limiting per uploader
 *   - audit logs
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { buildCorsHeaders, handlePreflight, jsonResponse } from '../_shared/cors.ts';

const ALLOWED_BUCKETS: Record<string, { mimes: string[]; maxBytes: number }> = {
  'vehicle-photos': {
    mimes: ['image/jpeg', 'image/png', 'image/webp'],
    maxBytes: 10 * 1024 * 1024,
  },
  'car-pass': {
    mimes: ['application/pdf', 'image/jpeg', 'image/png'],
    maxBytes: 10 * 1024 * 1024,
  },
};

const SAFE_FILENAME = /^[a-zA-Z0-9._-]{1,200}$/;

interface Body {
  bucket: string;
  filename: string;
  mime: string;
  size: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return handlePreflight(req);
  if (req.method !== 'POST') {
    return jsonResponse(req, { error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const auth = req.headers.get('Authorization') ?? '';
    const token = auth.replace('Bearer ', '').trim();
    if (!token) {
      return jsonResponse(req, { error: 'Unauthorized' }, { status: 401 });
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const ANON_KEY     = Deno.env.get('SUPABASE_ANON_KEY')!;
    const SERVICE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: userRes, error: userErr } = await userClient.auth.getUser(token);
    if (userErr || !userRes?.user) {
      return jsonResponse(req, { error: 'Unauthorized' }, { status: 401 });
    }
    const userId = userRes.user.id;

    const body = (await req.json().catch(() => null)) as Body | null;
    if (!body || !body.bucket || !body.filename || !body.mime || typeof body.size !== 'number') {
      return jsonResponse(req, { error: 'Invalid payload' }, { status: 400 });
    }

    const rules = ALLOWED_BUCKETS[body.bucket];
    if (!rules) return jsonResponse(req, { error: 'Bucket not allowed' }, { status: 400 });

    if (!rules.mimes.includes(body.mime)) {
      return jsonResponse(req, { error: 'Mime type not allowed' }, { status: 415 });
    }
    if (body.size <= 0 || body.size > rules.maxBytes) {
      return jsonResponse(req, { error: 'File too large' }, { status: 413 });
    }
    if (!SAFE_FILENAME.test(body.filename)) {
      return jsonResponse(req, { error: 'Invalid filename' }, { status: 400 });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // Per-user rate-limit: 30 signed URLs / 10 min
    const { data: rlOk, error: rlErr } = await admin.rpc('check_rate_limit', {
      _key: `upload_url:${userId}`,
      _max_attempts: 30,
      _window_seconds: 600,
    });
    if (!rlErr && rlOk === false) {
      return jsonResponse(req, { error: 'Too many upload requests' }, { status: 429 });
    }

    // Path: <userId>/<timestamp>-<safe filename>
    const stamp = Date.now();
    const path = `${userId}/${stamp}-${body.filename}`;

    const { data: signed, error: signErr } = await admin
      .storage
      .from(body.bucket)
      .createSignedUploadUrl(path);

    if (signErr || !signed) {
      console.error('signed url error', signErr);
      return jsonResponse(req, { error: 'Cannot create upload URL' }, { status: 500 });
    }

    return jsonResponse(req, {
      uploadUrl: signed.signedUrl,
      token: signed.token,
      path: signed.path,
      bucket: body.bucket,
    });
  } catch (e) {
    console.error('get-upload-url error', e);
    return jsonResponse(req, { error: 'Internal error' }, { status: 500 });
  }
});
