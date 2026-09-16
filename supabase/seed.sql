-- ==============================================================================
-- بيانات المحافظات والإدارات الأولية (Seed Data)
-- ==============================================================================

INSERT INTO governorates (code, name_ar) VALUES
('01', 'القاهرة'),
('02', 'الجيزة'),
('03', 'الإسكندرية'),
('14', 'القليوبية'),
('25', 'أسيوط')
ON CONFLICT (code) DO NOTHING;

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
