import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { UserRole } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      fullName,
      identifier,
      password,
      nationalId,
      role,
      roleTitleAr,
      governorateId,
      governorateNameAr,
      districtId,
      districtNameAr,
    } = body;

    if (!fullName || !identifier || !password || !role) {
      return NextResponse.json(
        { error: 'بيانات الحساب غير مكتملة (الاسم، المعرف، كلمة المرور، والدور مطلوبان).' },
        { status: 400 }
      );
    }

    const trimmedIdent = String(identifier).trim().toLowerCase();
    const email = trimmedIdent.includes('@')
      ? trimmedIdent
      : `${trimmedIdent}@masar.gov.eg`;

    const admin = createAdminClient();

    // 1. Check if user already exists in auth
    let userId: string | null = null;
    let page = 1;
    while (true) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
      if (error) throw error;
      const found = data.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
      if (found) {
        userId = found.id;
        break;
      }
      if (!data.users || data.users.length < 1000) break;
      page += 1;
    }

    if (!userId) {
      const { data: newUser, error: createError } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          role,
        },
      });

      if (createError) {
        return NextResponse.json({ error: createError.message }, { status: 400 });
      }
      userId = newUser.user.id;
    } else {
      // Update password if user already existed
      const { error: updateAuthError } = await admin.auth.admin.updateUserById(userId, {
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          role,
        },
      });
      if (updateAuthError) {
        return NextResponse.json({ error: updateAuthError.message }, { status: 400 });
      }
    }

    // 2. Upsert Profile
    const profilePayload = {
      id: userId,
      email,
      full_name: fullName,
      national_id: nationalId || null,
      role: role as UserRole,
      role_title_ar: roleTitleAr,
      governorate_id: governorateId || null,
      governorate_name_ar: governorateNameAr || null,
      district_id: districtId || null,
      district_name_ar: districtNameAr || null,
      active: true,
    };

    const { data: profile, error: profError } = await admin
      .from('profiles')
      .upsert(profilePayload, { onConflict: 'id' })
      .select('*')
      .single();

    if (profError) {
      return NextResponse.json({ error: profError.message }, { status: 400 });
    }

    // 3. Log Audit Trail
    try {
      await admin.from('audit_logs').insert({
        action: 'USER_CREATED',
        entity: 'profiles',
        entity_id: userId,
        metadata: {
          created_by_admin: true,
          created_email: email,
          role,
          role_title_ar: roleTitleAr,
          district: districtNameAr || null,
          governorate: governorateNameAr || null,
        },
      });
    } catch (auditErr) {
      console.warn('Could not write audit log for user creation:', auditErr);
    }

    const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || '';
    const proto = req.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
    const dynamicOrigin = process.env.NEXT_PUBLIC_APP_URL || (host ? `${proto}://${host}` : 'https://masar.gov.eg');

    return NextResponse.json({
      success: true,
      profile,
      credentials: {
        fullName,
        email,
        username: email.split('@')[0],
        password,
        roleTitleAr,
        governorateNameAr,
        districtNameAr,
        loginUrl: dynamicOrigin,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'حدث خطأ غير متوقع أثناء إنشاء المستخدم';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { userId, active } = await req.json();

    if (!userId || typeof active !== 'boolean') {
      return NextResponse.json({ error: 'المعرف والحالة مطلوبان.' }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: updatedProfile, error } = await admin
      .from('profiles')
      .update({ active })
      .eq('id', userId)
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, profile: updatedProfile });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'حدث خطأ غير متوقع';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
