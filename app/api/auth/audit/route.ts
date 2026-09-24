import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

const ALLOWED_ACTIONS = new Set([
  'LOGIN_SUCCESS',
  'LOGIN_FAILED',
  'LOGOUT',
  'SESSION_EXPIRED',
  'ACCOUNT_SUSPENDED',
  'ACCOUNT_ACTIVATED',
]);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, userId, identifier, role, roleTitleAr, reason, metadata = {} } = body;

    if (!action || !ALLOWED_ACTIONS.has(action)) {
      return NextResponse.json({ error: 'INVALID_ACTION' }, { status: 400 });
    }

    // Extract client IP and user agent safely for security auditing
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    // NEVER log password or secrets
    const safeMetadata: Record<string, unknown> = {
      ...metadata,
      identifier: identifier ? String(identifier).trim().toLowerCase() : undefined,
      role: role || undefined,
      role_title_ar: roleTitleAr || undefined,
      reason: reason || undefined,
      ip,
      user_agent: userAgent.slice(0, 150),
      recorded_at: new Date().toISOString(),
    };

    // Remove any accidental credential fields
    delete safeMetadata.password;
    delete safeMetadata.token;
    delete safeMetadata.secret;

    try {
      const admin = createAdminClient();

      const insertPayload = {
        user_id: userId || null,
        action,
        entity: 'auth',
        entity_id: userId || identifier || 'unknown',
        metadata: safeMetadata,
      };

      const { error } = await admin.from('audit_logs').insert(insertPayload);

      if (error) {
        console.warn('Failed to insert auth audit log:', error.message);
        return NextResponse.json({ success: false, error: 'DB_ERROR' }, { status: 200 });
      }
    } catch (adminErr: unknown) {
      const msg = adminErr instanceof Error ? adminErr.message : 'Admin client unconfigured';
      console.warn('Audit logging skipped (admin client unavailable):', msg);
      return NextResponse.json({ success: false, reason: 'AUDIT_UNAVAILABLE' }, { status: 200 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown audit error';
    console.warn('Auth audit route exception:', message);
    return NextResponse.json({ success: false, error: message }, { status: 200 });
  }
}
