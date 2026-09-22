import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.BOOTSTRAP_ADMIN_EMAIL || 'admin@masar.gov.eg';
const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;

if (!url) throw new Error('Missing SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL');
if (!serviceRoleKey) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
if (!password || password.length < 8) {
  throw new Error('BOOTSTRAP_ADMIN_PASSWORD must be at least 8 characters');
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function findUserByEmail(targetEmail) {
  let page = 1;
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const found = data.users.find(
      (user) => user.email?.toLowerCase() === targetEmail.toLowerCase()
    );
    if (found) return found;
    if (data.users.length < 1000) return null;
    page += 1;
  }
}

async function main() {
  let user = await findUserByEmail(email);

  if (!user) {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error) throw error;
    user = data.user;
    console.log(`Created Auth user: ${email}`);
  } else {
    const { error } = await supabase.auth.admin.updateUserById(user.id, {
      password,
      email_confirm: true,
    });
    if (error) throw error;
    console.log(`Updated existing Auth user: ${email}`);
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: user.id,
      email,
      role: 'super_admin',
      active: true,
      full_name: 'مسؤول النظام العام',
      role_title_ar: 'مسؤول النظام العام وتكنولوجيا المعلومات',
      governorate_id: null,
      governorate_name_ar: null,
      district_id: null,
      district_name_ar: null,
    }, { onConflict: 'id' });

  if (profileError) throw profileError;

  console.log('Super admin profile is ready.');
  console.log(`Login email: ${email}`);
}

main().catch((error) => {
  console.error('Bootstrap failed:', error.message || error);
  process.exit(1);
});
