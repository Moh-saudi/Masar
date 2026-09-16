-- ==============================================================================
-- منظومة «مَسَار» (MASAR Platform) - جمهورية مصر العربية - وزارة الصحة والسكان
-- كود إنشاء قاعدة البيانات الشاملة مع الحوكمة الزمنية والأمان (Supabase PostgreSQL)
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. أنواع الصلاحيات الهرمية
DO $$ BEGIN
    CREATE TYPE user_role_enum AS ENUM (
      'super_admin',
      'sector_head',
      'central_admin',
      'general_director',
      'directorate_user',
      'district_user'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. جدول المحافظات المصرية
CREATE TABLE IF NOT EXISTS governorates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(10) UNIQUE NOT NULL,
  name_ar VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. جدول الإدارات الصحية (نقطة الإدخال الأساسية والتجميعية الوحيدة)
CREATE TABLE IF NOT EXISTS health_districts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  governorate_id UUID REFERENCES governorates(id) ON DELETE CASCADE,
  code VARCHAR(20) UNIQUE NOT NULL,
  name_ar VARCHAR(150) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. جدول الملفات الشخصية للمستخدمين وصلاحياتهم (مرتبط بـ auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name VARCHAR(150) NOT NULL,
  national_id VARCHAR(14) UNIQUE,
  role user_role_enum NOT NULL DEFAULT 'district_user',
  governorate_id UUID REFERENCES governorates(id) ON DELETE SET NULL,
  district_id UUID REFERENCES health_districts(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. جدول البيانات الإجمالية اليومية للإدارة (Daily District Submissions)
CREATE TABLE IF NOT EXISTS daily_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_date DATE NOT NULL,
  district_id UUID REFERENCES health_districts(id) ON DELETE CASCADE,
  district_status VARCHAR(30) DEFAULT 'DRAFT',        -- DRAFT, SUBMITTED_LOCKED, RETURNED, APPROVED
  directorate_status VARCHAR(30) DEFAULT 'PENDING',    -- PENDING, APPROVED, RETURNED
  ministry_status VARCHAR(30) DEFAULT 'PENDING',       -- PENDING, APPROVED
  override_requested BOOLEAN DEFAULT FALSE,
  override_active BOOLEAN DEFAULT FALSE,
  override_expires_at TIMESTAMPTZ,
  override_reason TEXT,
  returned_reason TEXT,
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(submission_date, district_id)
);

-- 6. جدول بيانات الأقسام الـ 12 وحقول الإدخال الثلاثية
CREATE TABLE IF NOT EXISTS daily_section_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID REFERENCES daily_submissions(id) ON DELETE CASCADE,
  section_code INT NOT NULL CHECK (section_code BETWEEN 1 AND 12),
  section_name_ar VARCHAR(100) NOT NULL,
  field_1_value NUMERIC(10,2) DEFAULT 0,
  field_2_value NUMERIC(10,2) DEFAULT 0,
  field_3_value NUMERIC(10,2) DEFAULT 0,
  notes TEXT,
  updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(submission_id, section_code)
);

-- 7. سجل التدقيق والرقابة الشامل (Audit Trail)
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  actor_name VARCHAR(150),
  actor_role VARCHAR(50),
  action_type VARCHAR(50) NOT NULL,
  target_entity VARCHAR(50),
  target_id UUID,
  description TEXT,
  ip_address VARCHAR(45),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- دوال محرك الحوكمة الزمنية (Time-Lock Engine)
-- ==============================================================================

-- دالة فحص ما إذا كان مسموحاً للإدارة بالتعديل حالياً
CREATE OR REPLACE FUNCTION is_district_edit_allowed(sub_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_sub daily_submissions%ROWTYPE;
  v_current_time TIME := CURRENT_TIME;
BEGIN
  SELECT * INTO v_sub FROM daily_submissions WHERE id = sub_id;
  IF NOT FOUND THEN
    RETURN TRUE;
  END IF;

  -- إذا كان هناك فتح استثنائي ساري المفعول من المديرية (أقل من 30 دقيقة)
  IF v_sub.override_active AND v_sub.override_expires_at > NOW() THEN
    RETURN TRUE;
  END IF;

  -- إذا تجاوزت الساعة 03:00 عصراً أو تم الإقفال
  IF v_current_time >= '15:00:00'::TIME OR v_sub.district_status = 'SUBMITTED_LOCKED' THEN
    RETURN FALSE;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- تفعيل سياسات الأمان RLS (Row Level Security)
ALTER TABLE governorates ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_section_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- سياسات القراءة العامة للمصرح لهم
CREATE POLICY "Public read for governorates" ON governorates FOR SELECT USING (true);
CREATE POLICY "Public read for health_districts" ON health_districts FOR SELECT USING (true);
CREATE POLICY "Profiles read allowed" ON profiles FOR SELECT USING (true);
CREATE POLICY "Submissions read allowed" ON daily_submissions FOR SELECT USING (true);
CREATE POLICY "Section data read allowed" ON daily_section_data FOR SELECT USING (true);
CREATE POLICY "Audit logs read allowed" ON audit_logs FOR SELECT USING (true);
