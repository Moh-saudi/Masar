-- ==============================================================================
-- منظومة «مَسَار» (MASAR Platform) - جمهورية مصر العربية - وزارة الصحة والسكان
-- قطاع الرعاية الصحية وتنمية الأسرة - الإدارة العامة لتنظيم الأسرة والصحة الإنجابية
-- سكربت إعداد قاعدة البيانات الشامل (Full Database Setup & Sovereign Security)
-- متوافق تماماً مع Supabase PostgreSQL ويمكن ترحيله مباشرة للسيرفرات الحكومية
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. الأدوار الوظيفية والصلاحيات (Role-Based Access Control)
-- ------------------------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE user_role_enum AS ENUM (
      'super_admin',       -- مسؤول النظام التقني
      'sector_head',       -- رئيس قطاع الرعاية الصحية وتنمية الأسرة
      'central_admin',     -- رئيس الإدارة المركزية
      'general_director',  -- مدير عام الإدارة العامة لتنظيم الأسرة
      'directorate_user',  -- مسئول ومراجع المديرية بالمحافظة
      'district_user'      -- مدخل ومسؤول الإدارة الصحية
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ------------------------------------------------------------------------------
-- 2. جدول المحافظات المصرية الـ 27 (Governorates)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS governorates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(10) UNIQUE NOT NULL,
  name_ar VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 3. جدول الإدارات الصحية (Health Districts) - النطاق التجميعي الوحيد (260 إدارة)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS health_districts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  governorate_id UUID REFERENCES governorates(id) ON DELETE CASCADE,
  code VARCHAR(20) UNIQUE NOT NULL,
  name_ar VARCHAR(150) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 4. جدول الملفات الشخصية للمستخدمين والحسابات الحكومية (Profiles)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name VARCHAR(150) NOT NULL,
  national_id VARCHAR(14) UNIQUE,
  email VARCHAR(150) UNIQUE NOT NULL,
  role user_role_enum NOT NULL DEFAULT 'district_user',
  governorate_id UUID REFERENCES governorates(id) ON DELETE SET NULL,
  district_id UUID REFERENCES health_districts(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 5. جدول البيانات الإجمالية اليومية لكل إدارة (Daily District Submissions)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS daily_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_date DATE NOT NULL,
  district_id UUID REFERENCES health_districts(id) ON DELETE CASCADE,
  governorate_id UUID REFERENCES governorates(id) ON DELETE CASCADE,
  
  -- حالات التدقيق والحوكمة
  district_status VARCHAR(30) DEFAULT 'DRAFT',        -- DRAFT, SUBMITTED_LOCKED, RETURNED, APPROVED
  directorate_status VARCHAR(30) DEFAULT 'PENDING',    -- PENDING, APPROVED, RETURNED
  ministry_status VARCHAR(30) DEFAULT 'PENDING',       -- PENDING, APPROVED
  
  -- استثناءات الإرجاع والفتح المؤقت
  override_requested BOOLEAN DEFAULT FALSE,
  override_active BOOLEAN DEFAULT FALSE,
  override_expires_at TIMESTAMPTZ,
  override_reason TEXT,
  override_granted_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  returned_reason TEXT,
  returned_at TIMESTAMPTZ,
  returned_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  submitted_at TIMESTAMPTZ,
  submitted_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  directorate_approved_at TIMESTAMPTZ,
  directorate_approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  ministry_approved_at TIMESTAMPTZ,
  ministry_approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(submission_date, district_id)
);

-- ------------------------------------------------------------------------------
-- 6. جدول بيانات الأقسام الـ 12 وحقول الإدخال الثلاثية (Daily Section Data)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS daily_section_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID REFERENCES daily_submissions(id) ON DELETE CASCADE,
  section_code INT NOT NULL CHECK (section_code BETWEEN 1 AND 12),
  section_name_ar VARCHAR(100) NOT NULL,
  field_1_value NUMERIC(12,2) DEFAULT 0,
  field_2_value NUMERIC(12,2) DEFAULT 0,
  field_3_value NUMERIC(12,2) DEFAULT 0,
  notes TEXT,
  updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(submission_id, section_code)
);

-- ------------------------------------------------------------------------------
-- 7. سجل الرقابة والتدقيق الرقمي الصارم (Immutable Audit Logs)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  actor_name VARCHAR(150),
  actor_role VARCHAR(50),
  action_type VARCHAR(50) NOT NULL, -- SUBMIT, RETURN, OVERRIDE_GRANT, APPROVE_DIR, APPROVE_MIN, EDIT_SECTION
  target_entity VARCHAR(50),
  target_id UUID,
  district_name VARCHAR(150),
  governorate_name VARCHAR(100),
  description TEXT NOT NULL,
  ip_address VARCHAR(45),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 8. محرك الأمان والحوكمة الزمنية (Time-Lock & Business Validation Engine)
-- ------------------------------------------------------------------------------

-- التحقق من وقت إدخال الإدارة (الإغلاق الصارم 15:00 عصراً ما لم يتوفر استثناء ساري 30 دقيقة)
CREATE OR REPLACE FUNCTION check_district_entry_lock()
RETURNS TRIGGER AS $$
DECLARE
  v_override_active BOOLEAN;
  v_override_expires TIMESTAMPTZ;
  v_dist_status VARCHAR(30);
  v_current_time TIME := CURRENT_TIME;
BEGIN
  -- جلب حالة البيان الأصلي
  SELECT override_active, override_expires_at, district_status
  INTO v_override_active, v_override_expires, v_dist_status
  FROM daily_submissions WHERE id = NEW.submission_id;

  -- إذا كان البيان مرسلاً ومقفولاً
  IF v_dist_status = 'SUBMITTED_LOCKED' OR v_dist_status = 'APPROVED' THEN
    IF NOT (v_override_active AND v_override_expires > NOW()) THEN
      RAISE EXCEPTION 'غير مصرح بالتعديل: البيان مقفل بالفعل وتم إرساله للمديرية للاعتماد.';
    END IF;
  END IF;

  -- إذا تجاوز التوقيت الساعة 15:00 عصراً بتوقيت القاهرة
  IF v_current_time >= '15:00:00'::TIME THEN
    IF NOT (v_override_active AND v_override_expires > NOW()) THEN
      RAISE EXCEPTION 'تم إغلاق وقت الإدخال اليومي للإدارات الصحية في تمام الساعة 15:00 (الثالثة عصراً). يرجى طلب استثناء من مديرية الشئون الصحية.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_check_district_entry_lock ON daily_section_data;
CREATE TRIGGER trg_check_district_entry_lock
BEFORE INSERT OR UPDATE ON daily_section_data
FOR EACH ROW
EXECUTE FUNCTION check_district_entry_lock();

-- ------------------------------------------------------------------------------
-- 9. تفعيل جدار حماية الصفوف الصارم (Row Level Security - RLS)
-- ------------------------------------------------------------------------------
ALTER TABLE governorates ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_section_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- قراءة عامة للبيانات المرجعية (المحافظات والإدارات)
CREATE POLICY "RLS: Allow read governorates" ON governorates FOR SELECT USING (true);
CREATE POLICY "RLS: Allow read health_districts" ON health_districts FOR SELECT USING (true);

-- سياسة الملف الشخصي
CREATE POLICY "RLS: Read profile" ON profiles FOR SELECT USING (
  auth.uid() = id OR 
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'sector_head', 'central_admin', 'general_director'))
);

-- سياسة البيانات الإجمالية للإدارات (Submissions)
CREATE POLICY "RLS: Read submissions based on role" ON daily_submissions FOR SELECT USING (
  -- الوزارة والقيادات يرون الجمهورية بالكامل
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'sector_head', 'central_admin', 'general_director'))
  OR
  -- المديرية ترى فقط إدارات محافظتها
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'directorate_user' AND p.governorate_id = daily_submissions.governorate_id)
  OR
  -- الإدارة الصحية ترى فقط بيانات إدارتها
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'district_user' AND p.district_id = daily_submissions.district_id)
);

CREATE POLICY "RLS: Insert submissions" ON daily_submissions FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND (p.district_id = daily_submissions.district_id OR p.role IN ('super_admin', 'directorate_user')))
);

CREATE POLICY "RLS: Update submissions" ON daily_submissions FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND (
    (p.role = 'district_user' AND p.district_id = daily_submissions.district_id) OR
    (p.role = 'directorate_user' AND p.governorate_id = daily_submissions.governorate_id) OR
    (p.role IN ('super_admin', 'sector_head', 'central_admin', 'general_director'))
  ))
);

-- سياسة بيانات الأقسام الـ 12 (Section Data)
CREATE POLICY "RLS: Read section data" ON daily_section_data FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM daily_submissions s 
    WHERE s.id = daily_section_data.submission_id
    AND (
      EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'sector_head', 'central_admin', 'general_director'))
      OR
      EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'directorate_user' AND p.governorate_id = s.governorate_id)
      OR
      EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'district_user' AND p.district_id = s.district_id)
    )
  )
);

CREATE POLICY "RLS: Insert or Update section data" ON daily_section_data FOR ALL USING (
  EXISTS (
    SELECT 1 FROM daily_submissions s 
    WHERE s.id = daily_section_data.submission_id
    AND EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.district_id = s.district_id)
  )
);

-- سياسة سجلات الرقابة والتدقيق (Audit Logs - قراءة لمن يملكون الصلاحية)
CREATE POLICY "RLS: Read audit logs" ON audit_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'sector_head', 'central_admin', 'general_director', 'directorate_user'))
);

CREATE POLICY "RLS: Insert audit logs" ON audit_logs FOR INSERT WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 10. بذر البيانات المبدئية للمحافظات والإدارات (Seed Data)
-- ------------------------------------------------------------------------------
INSERT INTO governorates (code, name_ar) VALUES
('01', 'القاهرة'),
('02', 'الجيزة'),
('03', 'الإسكندرية'),
('14', 'القليوبية'),
('25', 'أسيوط')
ON CONFLICT (code) DO UPDATE SET name_ar = EXCLUDED.name_ar;

-- إدارات القاهرة
INSERT INTO health_districts (governorate_id, code, name_ar)
SELECT id, '0101', 'إدارة مدينة نصر الطبية' FROM governorates WHERE code = '01'
ON CONFLICT (code) DO NOTHING;

INSERT INTO health_districts (governorate_id, code, name_ar)
SELECT id, '0102', 'إدارة حلوان الطبية' FROM governorates WHERE code = '01'
ON CONFLICT (code) DO NOTHING;

INSERT INTO health_districts (governorate_id, code, name_ar)
SELECT id, '0103', 'إدارة المعادي الطبية' FROM governorates WHERE code = '01'
ON CONFLICT (code) DO NOTHING;

-- إدارات الجيزة
INSERT INTO health_districts (governorate_id, code, name_ar)
SELECT id, '0201', 'إدارة الدقي والعجوزة الطبية' FROM governorates WHERE code = '02'
ON CONFLICT (code) DO NOTHING;

INSERT INTO health_districts (governorate_id, code, name_ar)
SELECT id, '0202', 'إدارة 6 أكتوبر الطبية' FROM governorates WHERE code = '02'
ON CONFLICT (code) DO NOTHING;

-- إدارات الإسكندرية
INSERT INTO health_districts (governorate_id, code, name_ar)
SELECT id, '0301', 'إدارة المنتزه الطبية' FROM governorates WHERE code = '03'
ON CONFLICT (code) DO NOTHING;

INSERT INTO health_districts (governorate_id, code, name_ar)
SELECT id, '0302', 'إدارة شرق الطبية' FROM governorates WHERE code = '03'
ON CONFLICT (code) DO NOTHING;

-- انتهى سكربت التهيئة الكامل
