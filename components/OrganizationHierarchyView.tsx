'use client';

import React, { useState } from 'react';
import { UserProfile, HealthFacility, GeneralDirectorate, FacilityType } from '@/lib/types';
import { SAMPLE_GOVERNORATES } from '@/lib/constants';
import { exportToStyledExcel } from '@/lib/excel-export';
import { BulkDistrictsUploaderModal } from './BulkDistrictsUploaderModal';
import { 
  Building2, 
  Building, 
  Network, 
  Layers, 
  Plus, 
  Search, 
  ChevronRight, 
  ChevronDown, 
  Hospital, 
  Baby, 
  Home, 
  Truck, 
  ShieldCheck, 
  CheckCircle2, 
  Download, 
  X,
  Stethoscope,
  MapPin,
  Sparkles,
  SlidersHorizontal,
  UploadCloud,
  FileSpreadsheet
} from 'lucide-react';

interface OrganizationHierarchyViewProps {
  user: UserProfile;
}

// قائمة الإدارات العامة التأسيسية بديوان عام الوزارة
const INITIAL_GENERAL_DIRECTORATES: GeneralDirectorate[] = [
  {
    id: 'gd-1',
    code: 'GD-FP',
    name_ar: 'الإدارة العامة لتنظيم الأسرة وتنمية الأسرة',
    central_admin_name_ar: 'الإدارة المركزية لتنظيم الأسرة',
    sector_name_ar: 'قطاع الرعاية الصحية وتنمية الأسرة',
    head_name_ar: 'د. دعاء علي محمد',
    active_programs_count: 12,
  },
  {
    id: 'gd-2',
    code: 'GD-PHC',
    name_ar: 'الإدارة العامة للرعاية الصحية الأولية وصحة الأم والطفل',
    central_admin_name_ar: 'الإدارة المركزية لتنظيم الأسرة',
    sector_name_ar: 'قطاع الرعاية الصحية وتنمية الأسرة',
    head_name_ar: 'د. خالد عبد السميع عمران',
    active_programs_count: 8,
  },
  {
    id: 'gd-3',
    code: 'GD-WOMEN',
    name_ar: 'الإدارة العامة لصحة المرأة والمبادرات الرئاسية',
    central_admin_name_ar: 'الإدارة المركزية لتنظيم الأسرة',
    sector_name_ar: 'قطاع الرعاية الصحية وتنمية الأسرة',
    head_name_ar: 'د. نهى عاصم الجندي',
    active_programs_count: 5,
  },
  {
    id: 'gd-4',
    code: 'GD-MOBILE',
    name_ar: 'الإدارة العامة للقوافل الطبية والعيادات المتنقلة',
    central_admin_name_ar: 'الإدارة المركزية لتنظيم الأسرة',
    sector_name_ar: 'قطاع الرعاية الصحية وتنمية الأسرة',
    head_name_ar: 'د. وليد أنور عبد الخالق',
    active_programs_count: 6,
  },
];

// قائمة المنشآت الصحية التأسيسية
const INITIAL_FACILITIES: HealthFacility[] = [
  // القاهرة - مدينة نصر
  {
    id: 'fac-101',
    code: 'CA-NASR-01',
    name_ar: 'مركز طب أسرة الحي السادس',
    facility_type: 'FAMILY_HEALTH_CENTER',
    facility_type_ar: 'مركز طب أسرة حضري',
    governorate_id: 'gov-cairo',
    governorate_name_ar: 'القاهرة',
    district_id: 'dist-cairo-nasr-city',
    district_name_ar: 'إدارة مدينة نصر الطبية',
    has_ppfp_service: true,
    has_counseling_room: true,
    status: 'ACTIVE',
  },
  {
    id: 'fac-102',
    code: 'CA-NASR-02',
    name_ar: 'وحدة صحة الأسرة بالحي السابع',
    facility_type: 'FAMILY_HEALTH_UNIT',
    facility_type_ar: 'وحدة صحة أسرة',
    governorate_id: 'gov-cairo',
    governorate_name_ar: 'القاهرة',
    district_id: 'dist-cairo-nasr-city',
    district_name_ar: 'إدارة مدينة نصر الطبية',
    has_ppfp_service: false,
    has_counseling_room: true,
    status: 'ACTIVE',
  },
  {
    id: 'fac-103',
    code: 'CA-NASR-03',
    name_ar: 'مستشفى جراحات اليوم الواحد بمدينة نصر',
    facility_type: 'GENERAL_HOSPITAL',
    facility_type_ar: 'مستشفى عام / تخصصي',
    governorate_id: 'gov-cairo',
    governorate_name_ar: 'القاهرة',
    district_id: 'dist-cairo-nasr-city',
    district_name_ar: 'إدارة مدينة نصر الطبية',
    has_ppfp_service: true,
    has_counseling_room: true,
    status: 'ACTIVE',
  },
  // القاهرة - حلوان
  {
    id: 'fac-104',
    code: 'CA-HEL-01',
    name_ar: 'مستشفى حلوان العام (قسم التوليد PPFP)',
    facility_type: 'MATERNITY_HOSPITAL',
    facility_type_ar: 'مستشفى ولادة ونساء (PPFP)',
    governorate_id: 'gov-cairo',
    governorate_name_ar: 'القاهرة',
    district_id: 'dist-cairo-helwan',
    district_name_ar: 'إدارة حلوان الطبية',
    has_ppfp_service: true,
    has_counseling_room: true,
    status: 'ACTIVE',
  },
  {
    id: 'fac-105',
    code: 'CA-HEL-02',
    name_ar: 'مركز رعاية طفل حلوان',
    facility_type: 'FAMILY_HEALTH_CENTER',
    facility_type_ar: 'مركز طب أسرة حضري',
    governorate_id: 'gov-cairo',
    governorate_name_ar: 'القاهرة',
    district_id: 'dist-cairo-helwan',
    district_name_ar: 'إدارة حلوان الطبية',
    has_ppfp_service: false,
    has_counseling_room: true,
    status: 'ACTIVE',
  },
  // الإسكندرية - وسط
  {
    id: 'fac-201',
    code: 'ALX-WAS-01',
    name_ar: 'مستشفى الجلاء للولادة وصحة المرأة (PPFP)',
    facility_type: 'MATERNITY_HOSPITAL',
    facility_type_ar: 'مستشفى ولادة ونساء (PPFP)',
    governorate_id: 'gov-alex',
    governorate_name_ar: 'الإسكندرية',
    district_id: 'dist-alex-wasat',
    district_name_ar: 'إدارة وسط الطبية',
    has_ppfp_service: true,
    has_counseling_room: true,
    status: 'ACTIVE',
  },
  {
    id: 'fac-202',
    code: 'ALX-WAS-02',
    name_ar: 'مركز طب أسرة محرم بك',
    facility_type: 'FAMILY_HEALTH_CENTER',
    facility_type_ar: 'مركز طب أسرة حضري',
    governorate_id: 'gov-alex',
    governorate_name_ar: 'الإسكندرية',
    district_id: 'dist-alex-wasat',
    district_name_ar: 'إدارة وسط الطبية',
    has_ppfp_service: false,
    has_counseling_room: true,
    status: 'ACTIVE',
  },
  // الجيزة
  {
    id: 'fac-301',
    code: 'GIZ-DOK-01',
    name_ar: 'مركز طب أسرة الدقي',
    facility_type: 'FAMILY_HEALTH_CENTER',
    facility_type_ar: 'مركز طب أسرة حضري',
    governorate_id: 'gov-giza',
    governorate_name_ar: 'الجيزة',
    district_id: 'dist-giza-dokki',
    district_name_ar: 'إدارة الدقي والعجوزة الطبية',
    has_ppfp_service: false,
    has_counseling_room: true,
    status: 'ACTIVE',
  },
  {
    id: 'fac-302',
    code: 'GIZ-DOK-02',
    name_ar: 'مستشفى إمبابة العام (قسم النساء والتوليد)',
    facility_type: 'MATERNITY_HOSPITAL',
    facility_type_ar: 'مستشفى ولادة ونساء (PPFP)',
    governorate_id: 'gov-giza',
    governorate_name_ar: 'الجيزة',
    district_id: 'dist-giza-dokki',
    district_name_ar: 'إدارة الدقي والعجوزة الطبية',
    has_ppfp_service: true,
    has_counseling_room: true,
    status: 'ACTIVE',
  },
];

export const OrganizationHierarchyView: React.FC<OrganizationHierarchyViewProps> = ({ user }) => {
  const [activeViewMode, setActiveViewMode] = useState<'tree' | 'directory'>('tree');
  const [governorates, setGovernorates] = useState(SAMPLE_GOVERNORATES);
  const [generalDirectorates, setGeneralDirectorates] = useState<GeneralDirectorate[]>(INITIAL_GENERAL_DIRECTORATES);
  const [facilities, setFacilities] = useState<HealthFacility[]>(INITIAL_FACILITIES);
  
  // حالات طي وتوسيع شجرة الهيكل
  const [expandedMinistry, setExpandedMinistry] = useState<boolean>(true);
  const [expandedCentralAdmin, setExpandedCentralAdmin] = useState<boolean>(true);
  const [expandedGovs, setExpandedGovs] = useState<Record<string, boolean>>({
    'gov-cairo': true,
    'gov-alex': false,
    'gov-giza': false,
  });
  const [expandedDistricts, setExpandedDistricts] = useState<Record<string, boolean>>({
    'dist-cairo-nasr-city': true,
  });

  // نوافذ إضافة الكيانات (Modals)
  const [showAddFacilityModal, setShowAddFacilityModal] = useState<boolean>(false);
  const [showAddDistrictModal, setShowAddDistrictModal] = useState<boolean>(false);
  const [showAddGeneralDirectorateModal, setShowAddGeneralDirectorateModal] = useState<boolean>(false);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState<boolean>(false);
  const [importSuccessAlert, setImportSuccessAlert] = useState<{
    count: number;
    govsCount: number;
    facilitiesCount: number;
  } | null>(null);

  // حالات فورم إضافة منشأة
  const [newFacName, setNewFacName] = useState<string>('');
  const [newFacType, setNewFacType] = useState<FacilityType>('FAMILY_HEALTH_UNIT');
  const [newFacGovId, setNewFacGovId] = useState<string>('gov-cairo');
  const [newFacDistId, setNewFacDistId] = useState<string>('dist-cairo-nasr-city');
  const [newFacPpfp, setNewFacPpfp] = useState<boolean>(false);
  const [newFacCounseling, setNewFacCounseling] = useState<boolean>(true);

  // حالات فورم إضافة إدارة عامة
  const [newGdName, setNewGdName] = useState<string>('');
  const [newGdCode, setNewGdCode] = useState<string>('');
  const [newGdHead, setNewGdHead] = useState<string>('');

  // حالات البحث والفلترة في الدليل
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedGovFilter, setSelectedGovFilter] = useState<string>('ALL');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('ALL');

  const toggleGov = (govId: string) => {
    setExpandedGovs(prev => ({ ...prev, [govId]: !prev[govId] }));
  };

  const toggleDistrict = (distId: string) => {
    setExpandedDistricts(prev => ({ ...prev, [distId]: !prev[distId] }));
  };

  // معالجة استيراد كشف المديريات والإدارات من ملف الإكسيل
  const handleDistrictsImported = (imported: {
    governorateName: string;
    districtName: string;
    districtCode?: string;
    facilityName?: string;
  }[]) => {
    if (!imported || imported.length === 0) return;

    let addedDistrictsCount = 0;
    let addedFacilitiesCount = 0;
    const affectedGovIds: Record<string, boolean> = {};

    setGovernorates(prevGovs => {
      // استنساخ عميق للمديريات
      const updatedGovs = prevGovs.map(g => ({
        ...g,
        districts: g.districts ? [...g.districts] : []
      }));

      imported.forEach((row, index) => {
        const rawGov = row.governorateName?.trim() || '';
        const rawDist = row.districtName?.trim() || '';
        if (!rawGov || !rawDist) return;

        // تنظيف وتطبيع اسم المحافظة للمطابقة الذكية
        const cleanGovName = rawGov
          .replace(/^(مديرية|محافظة|مديرية الشئون الصحية بمحافظة|مديرية الشئون الصحية بـ|مديرية الشئون الصحية)\s*/g, '')
          .trim();

        let govIndex = updatedGovs.findIndex(g => 
          g.name_ar.includes(cleanGovName) || cleanGovName.includes(g.name_ar) || g.name_ar === rawGov
        );

        let targetGovId: string;
        let targetGovName: string;

        if (govIndex >= 0) {
          targetGovId = updatedGovs[govIndex].id;
          targetGovName = updatedGovs[govIndex].name_ar;
        } else {
          // إضافة مديرية جديدة للمحافظة إذا لم تكن موجودة
          targetGovId = `gov-${Date.now()}-${index}`;
          targetGovName = cleanGovName || rawGov;
          const newGovCode = String(updatedGovs.length + 1).padStart(2, '0');
          updatedGovs.push({
            id: targetGovId,
            code: newGovCode,
            name_ar: targetGovName,
            districts: []
          });
          govIndex = updatedGovs.length - 1;
        }

        affectedGovIds[targetGovId] = true;

        const currentGov = updatedGovs[govIndex];
        const distList = currentGov.districts || [];
        const existingDistIndex = distList.findIndex(d => d.name_ar.trim() === rawDist);

        let targetDistId: string;
        if (existingDistIndex >= 0) {
          targetDistId = distList[existingDistIndex].id;
        } else {
          targetDistId = `dist-${targetGovId}-${Date.now()}-${index}`;
          const distCode = row.districtCode || `${currentGov.code}${String(distList.length + 1).padStart(2, '0')}`;
          distList.push({
            id: targetDistId,
            code: distCode,
            name_ar: rawDist,
            governorate_id: targetGovId
          });
          currentGov.districts = distList;
          addedDistrictsCount++;
        }

        // إذا تضمن الصف اسم منشأة صحية بالعمود الرابع
        if (row.facilityName && row.facilityName.trim()) {
          const facName = row.facilityName.trim();
          setFacilities(prevFacs => {
            const exists = prevFacs.some(f => f.name_ar === facName && f.district_id === targetDistId);
            if (!exists) {
              addedFacilitiesCount++;
              return [
                {
                  id: `fac-${Date.now()}-${index}`,
                  code: `FAC-${Math.floor(1000 + Math.random() * 9000)}`,
                  name_ar: facName,
                  facility_type: 'FAMILY_HEALTH_UNIT',
                  facility_type_ar: 'وحدة صحة أسرة',
                  governorate_id: targetGovId,
                  governorate_name_ar: targetGovName,
                  district_id: targetDistId,
                  district_name_ar: rawDist,
                  has_ppfp_service: false,
                  has_counseling_room: true,
                  status: 'ACTIVE',
                },
                ...prevFacs
              ];
            }
            return prevFacs;
          });
        }
      });

      return updatedGovs;
    });

    // توسيع المديريات المعنية في الشجرة مباشرة للمعاينة الفورية
    setExpandedGovs(prev => ({
      ...prev,
      ...affectedGovIds
    }));

    const uniqueGovsCount = Object.keys(affectedGovIds).length;
    setImportSuccessAlert({
      count: addedDistrictsCount,
      govsCount: uniqueGovsCount,
      facilitiesCount: addedFacilitiesCount
    });
  };

  // حساب إجمالي الإدارات الصحية الحالية
  const totalDistrictsCount = governorates.reduce((sum, g) => sum + (g.districts?.length || 0), 0);

  // إضافة منشأة جديدة
  const handleCreateFacility = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFacName.trim()) return;

    const gov = governorates.find(g => g.id === newFacGovId);
    const dist = gov?.districts?.find(d => d.id === newFacDistId);

    const typeArMap: Record<FacilityType, string> = {
      'FAMILY_HEALTH_UNIT': 'وحدة صحة أسرة',
      'FAMILY_HEALTH_CENTER': 'مركز طب أسرة حضري',
      'MATERNITY_HOSPITAL': 'مستشفى ولادة ونساء (PPFP)',
      'GENERAL_HOSPITAL': 'مستشفى عام / مركزي',
      'MOBILE_CLINIC': 'عيادة متنقلة',
    };

    const newFacility: HealthFacility = {
      id: `fac-${Date.now()}`,
      code: `FAC-${Math.floor(1000 + Math.random() * 9000)}`,
      name_ar: newFacName.trim(),
      facility_type: newFacType,
      facility_type_ar: typeArMap[newFacType],
      governorate_id: newFacGovId,
      governorate_name_ar: gov?.name_ar || 'القاهرة',
      district_id: newFacDistId,
      district_name_ar: dist?.name_ar || 'إدارة صحية',
      has_ppfp_service: newFacPpfp,
      has_counseling_room: newFacCounseling,
      status: 'ACTIVE',
    };

    setFacilities(prev => [newFacility, ...prev]);
    setShowAddFacilityModal(false);
    setNewFacName('');
    alert(`تمت إضافة المنشأة الصحية: (${newFacility.name_ar}) بنجاح.`);
  };

  // إضافة إدارة عامة بديوان الوزارة
  const handleCreateGeneralDirectorate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGdName.trim()) return;

    const newGd: GeneralDirectorate = {
      id: `gd-${Date.now()}`,
      code: newGdCode.trim() || `GD-${Date.now()}`,
      name_ar: newGdName.trim(),
      central_admin_name_ar: 'الإدارة المركزية لتنظيم الأسرة',
      sector_name_ar: 'قطاع الرعاية الصحية وتنمية الأسرة',
      head_name_ar: newGdHead.trim() || 'قيد التكليف',
      active_programs_count: 1,
    };

    setGeneralDirectorates(prev => [...prev, newGd]);
    setShowAddGeneralDirectorateModal(false);
    setNewGdName('');
    setNewGdCode('');
    setNewGdHead('');
    alert(`تم استحداث الإدارة العامة: (${newGd.name_ar}) بالهيكل التنظيمي للوزارة بنجاح.`);
  };

  // تصفية المنشآت
  const filteredFacilities = facilities.filter(f => {
    const matchSearch = f.name_ar.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        f.district_name_ar.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        f.governorate_name_ar.toLowerCase().includes(searchTerm.toLowerCase());
    const matchGov = selectedGovFilter === 'ALL' || f.governorate_id === selectedGovFilter;
    const matchType = selectedTypeFilter === 'ALL' || f.facility_type === selectedTypeFilter;
    return matchSearch && matchGov && matchType;
  });

  // تصدير المنشآت إلى إكسيل
  const handleExportFacilitiesExcel = () => {
    const columns = [
      { header: 'كود المنشأة', key: 'code' },
      { header: 'اسم المنشأة الصحية', key: 'name_ar' },
      { header: 'نوع المنشأة', key: 'facility_type_ar' },
      { header: 'المحافظة', key: 'governorate_name_ar' },
      { header: 'الإدارة الصحية التابع لها', key: 'district_name_ar' },
      { header: 'خدمة PPFP بعد الولادة', key: 'has_ppfp_service' },
      { header: 'غرفة المشورة', key: 'has_counseling_room' },
      { header: 'الحالة', key: 'status' },
    ];

    const data = filteredFacilities.map(f => ({
      ...f,
      has_ppfp_service: f.has_ppfp_service ? 'نعم' : 'لا',
      has_counseling_room: f.has_counseling_room ? 'نعم' : 'لا',
      status: f.status === 'ACTIVE' ? 'نشطة' : 'معطلة',
    }));

    exportToStyledExcel(
      'دليل_المنشآت_الصحية_مسار',
      'دليل المنشآت ومراكز الرعاية الأولية ومستشفيات الولادة — منظومة مَسَار',
      columns,
      data
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      
      {/* 1. الترويسة الرئيسية للهيكل التنظيمي وإدارة المنشآت */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-200">
              <Network className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                الهيكل التنظيمي وإدارة المنشآت الصحية (Organizational Hierarchy & Facilities)
              </h2>
              <span className="text-xs text-slate-500 font-medium">
                إدارة هرم التبعية الإدارية من ديوان عام الوزارة وحتى الوحدات الصحية والمراكز ومستشفيات التوليد
              </span>
            </div>
          </div>
        </div>

        {/* أزرار الإضافة السريعة وتبديل نمط العرض */}
        <div className="flex flex-wrap items-center gap-2">
          
          <div className="p-1 bg-slate-100 rounded-xl flex items-center text-xs">
            <button
              onClick={() => setActiveViewMode('tree')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                activeViewMode === 'tree' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Network className="w-3.5 h-3.5 text-purple-600" />
              <span>الشجرة الهرمية التفاعلية</span>
            </button>
            <button
              onClick={() => setActiveViewMode('directory')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                activeViewMode === 'directory' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-sky-600" />
              <span>دليل المنشآت والوحدات ({facilities.length})</span>
            </button>
          </div>

          <button
            onClick={() => setShowBulkUploadModal(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 transition shadow-xs cursor-pointer"
            title="رفع كشف الإدارات والمديريات عبر نموذج إكسيل فوري"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>رفع كشف الإدارات (Excel)</span>
          </button>

          <button
            onClick={() => setShowAddFacilityModal(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white flex items-center gap-1.5 transition shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>إضافة منشأة صحية</span>
          </button>

          <button
            onClick={() => setShowAddGeneralDirectorateModal(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-1.5 transition shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>إضافة إدارة عامة</span>
          </button>
        </div>
      </div>

      {/* تنبيه نجاح الاستيراد عبر الإكسيل */}
      {importSuccessAlert && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-3 text-xs animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-emerald-600 text-white">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-emerald-950">تم الاستيراد بنجاح: </span>
              <span className="text-emerald-800">
                تم تحديث وإدراج <strong>{importSuccessAlert.count}</strong> إدارة صحية عبر <strong>{importSuccessAlert.govsCount}</strong> مديريات للشئون الصحية
                {importSuccessAlert.facilitiesCount > 0 && ` (مع إدراج ${importSuccessAlert.facilitiesCount} منشأة جديدة)`}! البيانات مسجلة بالهيكل الهرمي فوراً.
              </span>
            </div>
          </div>
          <button
            onClick={() => setImportSuccessAlert(null)}
            className="text-emerald-700 hover:text-emerald-950 p-1 rounded-lg hover:bg-emerald-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. بطاقات إحصائيات الهيكل الهرمي */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-slate-400 mb-1 font-semibold">قطاع الوزارة</div>
          <div className="text-xl font-black font-mono text-purple-700">1</div>
          <span className="text-[10px] text-slate-500">الرعاية وتنمية الأسرة</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-slate-400 mb-1 font-semibold">الإدارات المركزية</div>
          <div className="text-xl font-black font-mono text-purple-700">1</div>
          <span className="text-[10px] text-slate-500">تنظيم الأسرة</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-slate-400 mb-1 font-semibold">الإدارات العامة الفنية</div>
          <div className="text-xl font-black font-mono text-indigo-700">{generalDirectorates.length}</div>
          <span className="text-[10px] text-slate-500">بديوان عام الوزارة</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-slate-400 mb-1 font-semibold">مديريات الشئون الصحية</div>
          <div className="text-xl font-black font-mono text-sky-700">{governorates.length}</div>
          <span className="text-[10px] text-slate-500">محافظة مسجلة</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-slate-400 mb-1 font-semibold">الإدارات الصحية</div>
          <div className="text-xl font-black font-mono text-emerald-700">{totalDistrictsCount}</div>
          <span className="text-[10px] text-slate-500">إدارة طبية ميدانية</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-slate-400 mb-1 font-semibold">المنشآت ومستشفيات PPFP</div>
          <div className="text-xl font-black font-mono text-slate-900">{facilities.length}</div>
          <span className="text-[10px] text-emerald-600 font-bold">وحدات ومراكز ومستشفيات</span>
        </div>
      </div>

      {/* 3. النمط الأول: الشجرة الهرمية التفاعلية */}
      {activeViewMode === 'tree' ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          
          <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Network className="w-4 h-4 text-purple-600" />
              <span>الشجرة الهرمية للتبعية الإدارية والميدانية لمنظومة «مَسَار»</span>
            </h3>
            <span className="text-xs text-slate-400">
              انقر على أي عقدة (Node) للتوسيع أو الطي
            </span>
          </div>

          <div className="space-y-4 text-xs font-medium">
            
            {/* المستوى 1: ديوان عام الوزارة ورئيس القطاع */}
            <div className="border-2 border-purple-200 bg-purple-50/40 rounded-2xl p-4 space-y-3">
              <div 
                onClick={() => setExpandedMinistry(!expandedMinistry)}
                className="flex items-center justify-between cursor-pointer select-none"
              >
                <div className="flex items-center gap-2">
                  {expandedMinistry ? <ChevronDown className="w-4 h-4 text-purple-700" /> : <ChevronRight className="w-4 h-4 text-purple-700" />}
                  <span className="p-1.5 rounded-lg bg-purple-600 text-white font-black text-xs">ديوان الوزارة</span>
                  <span className="text-sm font-bold text-purple-950">قطاع الرعاية الصحية وتنمية الأسرة</span>
                  <span className="text-xs text-purple-700 font-mono">(sector_head: أ.د. حسام عبد الغفار)</span>
                </div>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 font-bold">
                  قمة الهرم السيادي
                </span>
              </div>

              {expandedMinistry && (
                <div className="pr-6 space-y-3 pt-2 border-r-2 border-purple-300 mr-2">
                  
                  {/* المستوى 2: الإدارة المركزية */}
                  <div className="border border-indigo-200 bg-indigo-50/50 rounded-xl p-3.5 space-y-2.5">
                    <div 
                      onClick={() => setExpandedCentralAdmin(!expandedCentralAdmin)}
                      className="flex items-center justify-between cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-2">
                        {expandedCentralAdmin ? <ChevronDown className="w-4 h-4 text-indigo-700" /> : <ChevronRight className="w-4 h-4 text-indigo-700" />}
                        <span className="p-1 rounded bg-indigo-600 text-white text-[10px] font-bold">إدارة مركزية</span>
                        <span className="font-bold text-indigo-950">الإدارة المركزية لتنظيم الأسرة</span>
                        <span className="text-xs text-indigo-600 font-mono">(central_admin: د. خالد عمران)</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 font-bold">
                        {generalDirectorates.length} إدارات عامة تابعة
                      </span>
                    </div>

                    {/* المستوى 3: الإدارات العامة بديوان الوزارة */}
                    {expandedCentralAdmin && (
                      <div className="pr-5 space-y-2 pt-2 border-r-2 border-indigo-300 mr-2">
                        {generalDirectorates.map(gd => (
                          <div key={gd.id} className="p-2.5 rounded-lg bg-white border border-indigo-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Layers className="w-3.5 h-3.5 text-indigo-600" />
                              <span className="font-bold text-slate-800">{gd.name_ar}</span>
                              <span className="text-[11px] text-slate-400 font-mono">({gd.code})</span>
                            </div>
                            <div className="text-[11px] text-indigo-700 font-bold">
                              المدير العام: {gd.head_name_ar}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* المستوى 4: مديريات الشئون الصحية */}
                  <div className="border border-sky-200 bg-sky-50/40 rounded-xl p-3.5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-sky-700" />
                        <span className="font-bold text-sky-950">مديريات الشئون الصحية بالمحافظات ({governorates.length} محافظة)</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-sky-100 text-sky-800 font-bold">
                        مستوى إقليمي (directorate_user)
                      </span>
                    </div>

                    <div className="space-y-2 pt-1">
                      {governorates.map(gov => {
                        const isGovExpanded = !!expandedGovs[gov.id];
                        const govFacs = facilities.filter(f => f.governorate_id === gov.id);

                        return (
                          <div key={gov.id} className="bg-white border border-slate-200 rounded-xl p-3 space-y-2">
                            <div 
                              onClick={() => toggleGov(gov.id)}
                              className="flex items-center justify-between cursor-pointer select-none"
                            >
                              <div className="flex items-center gap-2">
                                {isGovExpanded ? <ChevronDown className="w-4 h-4 text-sky-600" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                                <span className="p-1 rounded bg-sky-100 text-sky-800 font-bold text-[10px] font-mono">
                                  كود {gov.code}
                                </span>
                                <span className="font-bold text-slate-900">مديرية الشئون الصحية بمحافظة {gov.name_ar}</span>
                              </div>
                              <span className="text-[10px] font-mono text-slate-500">
                                {gov.districts?.length || 0} إدارات صحية • {govFacs.length} منشأة
                              </span>
                            </div>

                            {/* المستوى 5: الإدارات الصحية التابعة للمحافظة */}
                            {isGovExpanded && gov.districts && (
                              <div className="pr-5 space-y-2 pt-2 border-r-2 border-sky-300 mr-2">
                                {gov.districts.map(dist => {
                                  const isDistExpanded = !!expandedDistricts[dist.id];
                                  const distFacilities = facilities.filter(f => f.district_id === dist.id);

                                  return (
                                    <div key={dist.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                                      <div 
                                        onClick={() => toggleDistrict(dist.id)}
                                        className="flex items-center justify-between cursor-pointer select-none"
                                      >
                                        <div className="flex items-center gap-2">
                                          {isDistExpanded ? <ChevronDown className="w-3.5 h-3.5 text-emerald-600" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                                          <Building className="w-3.5 h-3.5 text-emerald-600" />
                                          <span className="font-bold text-slate-800">{dist.name_ar}</span>
                                          <span className="text-[10px] font-mono text-slate-400">({dist.code})</span>
                                        </div>
                                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold font-mono">
                                          {distFacilities.length} منشأة / وحدة
                                        </span>
                                      </div>

                                      {/* المستوى 6: الوحدات والمراكز التابعة للإدارة */}
                                      {isDistExpanded && (
                                        <div className="pr-4 space-y-1.5 pt-1 border-r-2 border-emerald-300 mr-2">
                                          {distFacilities.length > 0 ? (
                                            distFacilities.map(fac => (
                                              <div key={fac.id} className="p-2 rounded bg-white border border-slate-200 flex items-center justify-between text-xs">
                                                <div className="flex items-center gap-2">
                                                  {fac.facility_type === 'MATERNITY_HOSPITAL' ? <Baby className="w-3.5 h-3.5 text-indigo-600" /> :
                                                   fac.facility_type === 'GENERAL_HOSPITAL' ? <Hospital className="w-3.5 h-3.5 text-rose-600" /> :
                                                   <Home className="w-3.5 h-3.5 text-sky-600" />}
                                                  <span className="font-bold text-slate-800">{fac.name_ar}</span>
                                                  <span className="text-[10px] text-slate-400">({fac.facility_type_ar})</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                  {fac.has_ppfp_service && (
                                                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
                                                      PPFP توليد
                                                    </span>
                                                  )}
                                                  {fac.has_counseling_room && (
                                                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                                                      مشورة
                                                    </span>
                                                  )}
                                                </div>
                                              </div>
                                            ))
                                          ) : (
                                            <div className="text-[11px] text-slate-400 py-1">
                                              لا توجد منشآت مسجلة بهذه الإدارة بعد. انقر زر «إضافة منشأة صحية» لإدراج الوحدات.
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>
              )}
            </div>

          </div>

        </div>
      ) : (
        /* 4. النمط الثاني: جدول إدارة المنشآت والوحدات الصحية والبحث المتقدم */
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                دليل المنشآت ومراكز الرعاية الأولية ومستشفيات الولادة
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                حصر كافة الوحدات والمراكز والمستشفيات التابعة للإدارات الصحية الـ 260
              </p>
            </div>

            <button
              onClick={handleExportFacilitiesExcel}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 transition shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تصدير دليل المنشآت (Excel)</span>
            </button>
          </div>

          {/* فلاتر البحث والفرز */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <input
                type="text"
                placeholder="بحث باسم المنشأة أو الإدارة..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs p-2.5 pr-8 rounded-xl font-medium focus:outline-none focus:border-sky-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3.5" />
            </div>

            <div>
              <select
                value={selectedGovFilter}
                onChange={(e) => setSelectedGovFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs p-2.5 rounded-xl font-medium focus:outline-none focus:border-sky-500"
              >
                <option value="ALL">جميع المحافظات</option>
                {governorates.map(gov => (
                  <option key={gov.id} value={gov.id}>محافظة {gov.name_ar}</option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={selectedTypeFilter}
                onChange={(e) => setSelectedTypeFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs p-2.5 rounded-xl font-medium focus:outline-none focus:border-sky-500"
              >
                <option value="ALL">جميع أنواع المنشآت</option>
                <option value="FAMILY_HEALTH_UNIT">وحدات صحة الأسرة</option>
                <option value="FAMILY_HEALTH_CENTER">مراكز طب الأسرة الحضرية</option>
                <option value="MATERNITY_HOSPITAL">مستشفيات الولادة والـ PPFP</option>
                <option value="GENERAL_HOSPITAL">مستشفيات عامة / مركزية</option>
                <option value="MOBILE_CLINIC">عيادات متنقلة</option>
              </select>
            </div>
          </div>

          {/* جدول المنشآت */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold text-[11px]">
                <tr>
                  <th className="p-3 w-12 text-center">م</th>
                  <th className="p-3">اسم المنشأة الصحية</th>
                  <th className="p-3">نوع المنشأة</th>
                  <th className="p-3">الإدارة الصحية</th>
                  <th className="p-3">المحافظة</th>
                  <th className="p-3 text-center">خدمة PPFP</th>
                  <th className="p-3 text-center">غرفة مشورة</th>
                  <th className="p-3 text-center">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredFacilities.map((fac, idx) => (
                  <tr key={fac.id} className="hover:bg-slate-50/70 transition">
                    <td className="p-2.5 text-center font-bold font-mono text-slate-400">{idx + 1}</td>
                    <td className="p-2.5 font-bold text-slate-900 flex items-center gap-2">
                      {fac.facility_type === 'MATERNITY_HOSPITAL' ? <Baby className="w-3.5 h-3.5 text-indigo-600" /> :
                       fac.facility_type === 'GENERAL_HOSPITAL' ? <Hospital className="w-3.5 h-3.5 text-rose-600" /> :
                       <Home className="w-3.5 h-3.5 text-sky-600" />}
                      <span>{fac.name_ar}</span>
                    </td>
                    <td className="p-2.5 text-slate-600 font-medium">{fac.facility_type_ar}</td>
                    <td className="p-2.5 text-slate-700">{fac.district_name_ar}</td>
                    <td className="p-2.5 text-slate-700">{fac.governorate_name_ar}</td>
                    <td className="p-2.5 text-center font-mono">
                      {fac.has_ppfp_service ? (
                        <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold text-[10px]">مفعلة ✓</span>
                      ) : (
                        <span className="text-slate-400 text-[10px]">غير متاحة</span>
                      )}
                    </td>
                    <td className="p-2.5 text-center font-mono">
                      {fac.has_counseling_room ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]">متاحة ✓</span>
                      ) : (
                        <span className="text-slate-400 text-[10px]">لا يوجد</span>
                      )}
                    </td>
                    <td className="p-2.5 text-center font-mono">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">نشطة</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* 5. نافذة منبثقة: إضافة منشأة صحية جديدة (Add Facility Modal) */}
      {showAddFacilityModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl relative space-y-4">
            <button
              onClick={() => setShowAddFacilityModal(false)}
              className="absolute left-5 top-5 text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="p-2 rounded-xl bg-sky-50 text-sky-700 border border-sky-200">
                <Hospital className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">إضافة منشأة صحية جديدة للهيكل</h3>
                <p className="text-xs text-slate-400">تسجيل وحدة رعاية أولية أو مركز أو مستشفى توليد</p>
              </div>
            </div>

            <form onSubmit={handleCreateFacility} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">اسم المنشأة الصحية:</label>
                <input
                  type="text"
                  required
                  value={newFacName}
                  onChange={(e) => setNewFacName(e.target.value)}
                  placeholder="مثال: مركز طب أسرة الحي السابع أو مستشفى الجلاء"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">نوع المنشأة:</label>
                  <select
                    value={newFacType}
                    onChange={(e) => setNewFacType(e.target.value as FacilityType)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium focus:outline-none focus:border-sky-500"
                  >
                    <option value="FAMILY_HEALTH_UNIT">وحدة صحة أسرة</option>
                    <option value="FAMILY_HEALTH_CENTER">مركز طب أسرة حضري</option>
                    <option value="MATERNITY_HOSPITAL">مستشفى ولادة ونساء (PPFP)</option>
                    <option value="GENERAL_HOSPITAL">مستشفى عام / مركزي</option>
                    <option value="MOBILE_CLINIC">عيادة متنقلة</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">المحافظة التابع لها:</label>
                  <select
                    value={newFacGovId}
                    onChange={(e) => {
                      setNewFacGovId(e.target.value);
                      const selectedGov = governorates.find(g => g.id === e.target.value);
                      if (selectedGov?.districts?.[0]) {
                        setNewFacDistId(selectedGov.districts[0].id);
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium focus:outline-none focus:border-sky-500"
                  >
                    {governorates.map(gov => (
                      <option key={gov.id} value={gov.id}>محافظة {gov.name_ar}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">الإدارة الصحية التابع لها:</label>
                <select
                  value={newFacDistId}
                  onChange={(e) => setNewFacDistId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium focus:outline-none focus:border-sky-500"
                >
                  {(governorates.find(g => g.id === newFacGovId)?.districts || []).map(dist => (
                    <option key={dist.id} value={dist.id}>{dist.name_ar}</option>
                  ))}
                </select>
              </div>

              <div className="pt-2 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newFacPpfp}
                    onChange={(e) => setNewFacPpfp(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="font-bold text-slate-800">توفر خدمة تركيب اللوالب أثناء القيصرية والولادة (PPFP)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newFacCounseling}
                    onChange={(e) => setNewFacCounseling(e.target.checked)}
                    className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500"
                  />
                  <span className="font-bold text-slate-800">توفر غرفة مشورة تنظيم الأسرة المتكاملة</span>
                </label>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddFacilityModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold transition shadow-xs"
                >
                  حفظ المنشأة وإدراجها
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. نافذة منبثقة: إضافة إدارة عامة بديوان الوزارة (Add General Directorate Modal) */}
      {showAddGeneralDirectorateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl relative space-y-4">
            <button
              onClick={() => setShowAddGeneralDirectorateModal(false)}
              className="absolute left-5 top-5 text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="p-2 rounded-xl bg-purple-50 text-purple-700 border border-purple-200">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">إضافة إدارة عامة بديوان الوزارة</h3>
                <p className="text-xs text-slate-400">استحداث إدارة عامة تحت قطاع الرعاية وتنمية الأسرة</p>
              </div>
            </div>

            <form onSubmit={handleCreateGeneralDirectorate} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">اسم الإدارة العامة:</label>
                <input
                  type="text"
                  required
                  value={newGdName}
                  onChange={(e) => setNewGdName(e.target.value)}
                  placeholder="مثال: الإدارة العامة لصحة اليافعين والشباب"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">الكود التنظيمي للإدارة:</label>
                <input
                  type="text"
                  value={newGdCode}
                  onChange={(e) => setNewGdCode(e.target.value)}
                  placeholder="مثال: GD-YOUTH"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-mono focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">اسم المدير العام المكلف:</label>
                <input
                  type="text"
                  value={newGdHead}
                  onChange={(e) => setNewGdHead(e.target.value)}
                  placeholder="مثال: د. هاني فتحي عبد المنعم"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddGeneralDirectorateModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold transition shadow-xs"
                >
                  إدراج الإدارة العامة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. نافذة منبثقة: رفع واستيراد كشف المديريات والإدارات الصحية من إكسيل */}
      <BulkDistrictsUploaderModal
        isOpen={showBulkUploadModal}
        onClose={() => setShowBulkUploadModal(false)}
        onDistrictsImported={handleDistrictsImported}
      />

    </div>
  );
};
