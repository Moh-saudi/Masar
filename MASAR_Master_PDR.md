# وثيقة التصميم والمتطلبات الأولية المتكاملة — منظومة «مَسَار» (Master PDR - MASAR Platform)
**جمهورية مصر العربية — وزارة الصحة والسكان**  
**قطاع الرعاية الصحية وتنمية الأسرة — إدارة تنمية الأسرة**

---

## 1. ملخص المشروع ونطاق العمل (Project Scope & Operational Context)
* **اسم المنظومة:** المنظومة الرقمية لتجميع وتحليل بيانات تنمية الأسرة **«مَسَار» (MASAR: Monitored Aggregated System for Analytics & Reporting)**.
* **الجهة المالكة:** إدارة تنمية الأسرة بقطاع الرعاية الصحية وتنمية الأسرة في وزارة الصحة والسكان.
* **نموذج تجميع البيانات المعتمد:** نظراً لعدم توفر أجهزة حاسب آلي في منشآت الرعاية الأولية (الوحدات والمراكز)، تم اعتماد **مستوى الإدارة الصحية كخط الأساس الأول والوحيد لإدخال البيانات بالمنظومة (District Aggregated Entry Point)**؛ حيث يقوم موظف الإدارة بجمع الكشوف الورقية من كافة عيادات ومنافذ تنمية الأسرة التابعة وتسجيل "بيان إجمالي تجميعي موحد للإدارة" يومياً.
* **التدرج الهرمي والربط:** الإدارة الصحية (إدخال وإرسال) $\leftarrow$ مديرية الشئون الصحية بالمحافظة (تدقيق واعتماد) $\leftarrow$ ديوان عام الوزارة (تحليل تكتيكي، استراتيجي، وإنذار مبكر).

---

## 2. محرك الحوكمة الزمنية وقيد "الجهة الأم" (Time-Lock & Rejection Engine)
لضمان انضباط ودقة الإحصائيات الحيوية، تم ضبط النوافذ الزمنية الإدارية بدقة تامة:
* **03:00 عصراً (إغلاق الإدارة):** تنتهي نافذة إدخال وتعديل البيانات للإدارة الصحية تماماً في تمام الساعة 03:00 عصراً، وتتحول حالة البيان تلقائياً إلى `SUBMITTED_LOCKED`.
* **06:00 مساءً (إغلاق المديرية):** تتاح لمديرية الشئون الصحية نافذة فحص ومراجعة إجماليات الإدارات حتى الساعة 06:00 مساءً، مع صلاحية إرجاع البيان للتعديل.
* **10:00 مساءً (الإغلاق القومي للوزارة):** الإغلاق النهائي والاعتماد النهائي للتقرير القومي الموحد لليوم.
* **قيد "الجهة الأم" (Mother Authority Override):** بعد الساعة 03:00 عصراً، لا تملك الإدارة أي صلاحية لفتح أو تعديل البيان ذاتياً. وأي تصحيح يتطلب رفع طلب إلكتروني مسبب لمديرية المحافظة (الجهة الأم) لمنح فتح مؤقت (30 دقيقة)، مسجل بالكامل في سجل التدقيق (`Audit Trail`).

---

## 3. مصفوفة الصلاحيات الهرمية للمستخدمين (RBAC Matrix)

| المستوى الإداري | المستخدم المستهدف | صلاحية الإدخال والرفع | صلاحية الإرجاع للتعديل | صلاحية الفتح الاستثنائي |
| :--- | :--- | :--- | :--- | :--- |
| **الإدارة الصحية** | موظف الإدارة / منسق تنمية الأسرة | تسجيل البيان الإجمالي والرفع حتى 03:00 م | لا يوجد (مستوى إدخال أساسي) | محظور (يتطلب موافقة المديرية) |
| **مديرية المحافظة** | مدير تنظيم الأسرة / وكيل الوزارة | مراجعة إجماليات الإدارات حتى 06:00 م | إرجاع البيان للإدارة حتى 06:00 م | منح فتح مؤقت (30 دقيقة) قبل 6 م |
| **الوزارة: مدير عام** | مدير عام تنمية الأسرة | متابعة فنية تفصيلية ومقارنة المخرجات | إرجاع بيان المحافظة حتى 10:00 م | يتطلب موافقة الإدارة المركزية |
| **الوزارة: رئيس إدارة مركزية** | رئيس الإدارة المركزية | تحليل تكتيكي مقارن للأقاليم والمحافظات | إرجاع بيان المحافظة حتى 10:00 م | يتطلب موافقة رئيس القطاع |
| **الوزارة: رئيس القطاع والوزير** | رئيس القطاع / معالي الوزير | اعتماد التقرير القومي النهائي الشامل | صلاحية استثنائية عليا | صلاحية الفتح المركزي العام (Master Override) |

---

## 4. هندسة واجهة الإدخال الذكية (Sidebar Navigation & Dynamic Log)
تم اعتماد نمط **Master-Detail UI/UX** لتسهيل عمل موظف الإدارة الصحية:
1. **القائمة الجانبية (Sidebar):** تعرض الأقسام الـ 12 رأسياً مع شارات حالة الإنجاز (`مكتمل` بالأخضر، `مسودة` بالكهرماني، `فارغ` بالرمادي).
2. **لوحة التفاصيل (Dynamic Panel):** عند النقر على أي قسم، تفتح في المساحة المقابلة **الحقول الثلاثة المخصصة للإدخال** مع دعم التنقل السريع بلوحة المفاتيح (`Tab` & `Enter`).
3. **سجل النشاط التاريخي (Section History Log):** يظهر أسفل الحقول ليعرض حصراً أرقام الأيام السابقة لنفس القسم، هوية وتوقيت آخر تعديل (`Editor ID & Timestamp`)، وملاحظات النظام التحليلية.

---

## 5. مصفوفة الأقسام الـ 12 وحقول الإدخال الثلاثية (Master Data Matrix)

| م | القسم بالقائمة الجانبية | الحقل الأول (Field 1) | الحقل الثاني (Field 2) | الحقل الثالث (Field 3) |
| :--- | :--- | :--- | :--- | :--- |
| **المجموعة الأولى: التردد الداخلي بالمنشآت والمستشفيات** | | | | |
| 1 | **غرف المشورة الأسرية** | عدد المترددين | التحويلات لتنظيم الأسرة | مستخدمات وسائل LARC |
| 2 | **التطعيمات (درن/غدة)** | سيدات سن الإنجاب | التحويلات لتنظيم الأسرة | مستخدمات وسائل LARC |
| 3 | **منافذ صرف الألبان** | سيدات سن الإنجاب | التحويلات لتنظيم الأسرة | مستخدمات وسائل LARC |
| 4 | **المستشفيات العلاجية** | سيدات سن الإنجاب | التحويلات لتنظيم الأسرة | مستخدمات وسائل LARC |
| 5 | **المبادرات الرئاسية** | صحة المرأة | الأم والجنين | فحص السمع للأطفال |
| 6 | **زيارات النفاس** | سيدات تمت زيارتهن | التحويلات (ثابتة/متنقلة) | مستخدمات وسائل LARC |
| **المجموعة الثانية: الأنشطة الميدانية والشراكات الخارجية** | | | | |
| 7 | **الجمعيات الأهلية** | عدد الحضور | التحويلات (ثابتة/متنقلة) | مستخدمات وسائل LARC |
| 8 | **مراكز الشباب** | عدد الحضور | التحويلات (ثابتة/متنقلة) | مستخدمات وسائل LARC |
| 9 | **المساجد والكنائس** | عدد الحضور | التحويلات (ثابتة/متنقلة) | مستخدمات وسائل LARC |
| 10 | **قوافل خارجية** | عدد الحضور | التحويلات (ثابتة/متنقلة) | مستخدمات وسائل LARC |
| 11 | **أنشطة القطاع الخاص** | عدد الحضور | التحويلات (ثابتة/متنقلة) | مستخدمات وسائل LARC |
| **المجموعة الثالثة: حصيلة الوسائل طويلة المدى LARC** | | | | |
| 12 | **منصرف وسائل LARC** | لولب نحاسي المنصرف | لولب هرموني المنصرف | كبسولات إمبلانون المنصرف |

---

## 6. الكود البرمجي لإنشاء قاعدة البيانات في Supabase (SQL Schema)
قم بتنفيذ هذا الكود بالكامل في **Supabase SQL Editor**:

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE user_role_enum AS ENUM (
  'super_admin',
  'sector_head',
  'central_admin',
  'general_director',
  'directorate_user',
  'district_user'
);

CREATE TABLE governorates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(10) UNIQUE NOT NULL,
  name_ar VARCHAR(100) NOT NULL
);

CREATE TABLE health_districts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  governorate_id UUID REFERENCES governorates(id) ON DELETE CASCADE,
  code VARCHAR(20) UNIQUE NOT NULL,
  name_ar VARCHAR(150) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name VARCHAR(150) NOT NULL,
  national_id VARCHAR(14) UNIQUE,
  role user_role_enum NOT NULL DEFAULT 'district_user',
  governorate_id UUID REFERENCES governorates(id) ON DELETE SET NULL,
  district_id UUID REFERENCES health_districts(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE daily_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_date DATE NOT NULL,
  district_id UUID REFERENCES health_districts(id) ON DELETE CASCADE,
  district_status VARCHAR(30) DEFAULT 'DRAFT',
  directorate_status VARCHAR(30) DEFAULT 'PENDING',
  ministry_status VARCHAR(30) DEFAULT 'PENDING',
  override_requested BOOLEAN DEFAULT FALSE,
  override_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(submission_date, district_id)
);

CREATE TABLE daily_section_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID REFERENCES daily_submissions(id) ON DELETE CASCADE,
  section_code INT NOT NULL CHECK (section_code BETWEEN 1 AND 12),
  section_name_ar VARCHAR(100) NOT NULL,
  field_1_value NUMERIC(10,2) DEFAULT 0,
  field_2_value NUMERIC(10,2) DEFAULT 0,
  field_3_value NUMERIC(10,2) DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action_type VARCHAR(50) NOT NULL,
  target_entity VARCHAR(50),
  target_id UUID,
  ip_address VARCHAR(45),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 7. المكتبات وحزمة التقنيات المعتمدة (Frontend & UI Stack)
* **إطار العمل:** `Next.js (App Router)` + `TypeScript`.
* **مكتبة المكونات:** `HeroUI` (NextUI سابقاً) لدعم الـ RTL والمكونات التفاعلية المتقدمة.
* **التنسيق:** `Tailwind CSS` (مع الالتزام بالهوية: كحلي رسمي `#0F172A`، أزرق صحي `#0284C7`، أخضر الحماية `#16A34A`، وأحمر الإغلاق `#DC2626`).
* **الأيقونات والخطوط:** `Lucide React` + خط `Noto Sans Arabic`.
* **الرسوم البيانية:** `Recharts` لرسم مسارات الاتجاه الزمني (Trend Curves) والتنبؤ الفصلي (AI Forecast).

---
*هذا المستند يمثل المرجع الهندسي النهائي لتنفيذ منظومة «مَسَار» (MASAR) بدقة متناهية ودون أي تكرار عشوائي.*
