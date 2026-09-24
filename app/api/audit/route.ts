import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createBrowserClient } from '@/lib/supabase/client';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import type { AuditLog, UserProfile } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const serverClient = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    });

    const { data: { user: authUser } } = await serverClient.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

    const admin = createAdminClient();

    // Fetch user profile
    const { data: profile } = await admin
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (!profile || !profile.active) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.min(200, Math.max(1, Number(searchParams.get('limit') || 100)));

    let query = admin
      .from('audit_logs')
      .select('id, action, metadata, entity_id, user_id, created_at')
      .order('created_at', { ascending: false })
      .limit(limit);

    // Apply role-based visibility
    if (['super_admin', 'central_admin', 'sector_head', 'general_director'].includes(profile.role)) {
      // Admins see all logs
    } else if (profile.role === 'directorate_user') {
      // Directorate reviewer sees logs for their governorate and own actions
      const govName = profile.governorate_name_ar || '';
      query = query.or(`user_id.eq.${profile.id},metadata->>governorate.eq.${govName},metadata->>governorate_id.eq.${profile.governorate_id || ''}`);
    } else if (profile.role === 'district_user') {
      // District officer sees logs for their district and own actions
      const distName = profile.district_name_ar || '';
      const distId = profile.district_id || '';
      query = query.or(`user_id.eq.${profile.id},metadata->>target_district.eq.${distName},metadata->>district.eq.${distName},metadata->>district_id.eq.${distId}`);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Audit query error:', error);
      throw error;
    }

    const logs: AuditLog[] = (data ?? []).map((row: any) => {
      const metadata = row.metadata ?? {};
      return {
        id: row.id,
        timestamp: metadata.timestamp ?? new Date(row.created_at).toLocaleString('ar-EG'),
        actor_name: metadata.actor_name ?? metadata.user_name ?? (row.user_id === profile.id ? profile.full_name : 'مستخدم المنظومة'),
        actor_role: metadata.actor_role ?? metadata.role_title_ar ?? '',
        action_type: row.action,
        description: metadata.description ?? row.action,
        target_district: metadata.target_district ?? metadata.district ?? undefined,
      };
    });

    return NextResponse.json({ logs });
  } catch (error) {
    console.error('Failed to load audit logs:', error);
    return NextResponse.json({ logs: [] });
  }
}
