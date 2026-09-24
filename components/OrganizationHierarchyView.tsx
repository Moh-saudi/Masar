'use client';

import React, { useState } from 'react';
import { UserProfile, HealthFacility, GeneralDirectorate, CentralAdministration, FacilityType, HealthDistrict } from '@/lib/types';
import { SAMPLE_GOVERNORATES } from '@/lib/constants';
import { OFFICIAL_FACILITIES } from '@/lib/official-facilities-data';
import { exportToStyledExcel } from '@/lib/excel-export';
import { BulkDistrictsUploaderModal } from './BulkDistrictsUploaderModal';
import { OperationFeedbackDialog } from './OperationFeedbackDialog';
import { 
  Building2, 
  Building, 
  Network, 
  Layers, 
  Plus, 
  Edit3,
  Pencil,
  User, 
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
  FileSpreadsheet,
  Trash2,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';

interface OrganizationHierarchyViewProps {
  user: UserProfile;
}

// قائمة الإدارات المركزية بديوان عام الوزارة (قطاع الرعاية وتنمية الأسرة)
const INITIAL_CENTRAL_ADMINISTRATIONS: CentralAdministration[] = [
  {
    id: 'ca-1',
    code: 'CA-FP',
    name_ar: 'الإدارة المركزية لتنظيم وتنمية الأسرة',
    sector_name_ar: 'قطاع الرعاية الصحية وتنمية الأسرة',
    head_name_ar: 'د. دعاء علي محمد',
  },
  {
    id: 'ca-2',
    code: 'CA-PHC',
    name_ar: 'الإدارة المركزية للرعاية الصحية الأولية والوقائية',
    sector_name_ar: 'قطاع الرعاية الصحية وتنمية الأسرة',
    head_name_ar: 'د. خالد عبد السميع عمران',
  },
  {
    id: 'ca-3',
    code: 'CA-EVAL',
    name_ar: 'الإدارة المركزية للمتابعة والتقييم والمعلومات والتحول الرقمي',
    sector_name_ar: 'قطاع الرعاية الصحية وتنمية الأسرة',
    head_name_ar: 'د. إيناس مصطفى عز العرب',
  },
];

// قائمة الإدارات العامة التأسيسية تابعة لكل إدارة مركزية
const INITIAL_GENERAL_DIRECTORATES: GeneralDirectorate[] = [
  // تابعة لـ: الإدارة المركزية لتنظيم وتنمية الأسرة
  {
    id: 'gd-1',
    code: 'GD-FP',
    name_ar: 'الإدارة العامة لتنظيم الأسرة وتنمية الأسرة',
    central_admin_id: 'ca-1',
    central_admin_name_ar: 'الإدارة المركزية لتنظيم وتنمية الأسرة',
    sector_name_ar: 'قطاع الرعاية الصحية وتنمية الأسرة',
    head_name_ar: 'د. نهى عاصم الجندي',
    active_programs_count: 12,
  },
  {
    id: 'gd-2',
    code: 'GD-RH',
    name_ar: 'الإدارة العامة لخدمات الصحة الإنجابية وصحة المرأة',
    central_admin_id: 'ca-1',
    central_admin_name_ar: 'الإدارة المركزية لتنظيم وتنمية الأسرة',
    sector_name_ar: 'قطاع الرعاية الصحية وتنمية الأسرة',
    head_name_ar: 'د. منى عبد الحليم الشريف',
    active_programs_count: 8,
  },
  {
    id: 'gd-3',
    code: 'GD-IEC',
    name_ar: 'الإدارة العامة للإعلام والتربية السكانية والمشورة',
    central_admin_id: 'ca-1',
    central_admin_name_ar: 'الإدارة المركزية لتنظيم وتنمية الأسرة',
    sector_name_ar: 'قطاع الرعاية الصحية وتنمية الأسرة',
    head_name_ar: 'د. أمل مصطفى رضوان',
    active_programs_count: 5,
  },
  {
    id: 'gd-4',
    code: 'GD-MOBILE',
    name_ar: 'الإدارة العامة للقوافل الطبية والعيادات المتنقلة',
    central_admin_id: 'ca-1',
    central_admin_name_ar: 'الإدارة المركزية لتنظيم وتنمية الأسرة',
    sector_name_ar: 'قطاع الرعاية الصحية وتنمية الأسرة',
    head_name_ar: 'د. وليد أنور عبد الخالق',
    active_programs_count: 6,
  },
  // تابعة لـ: الإدارة المركزية للرعاية الصحية الأولية والوقائية
  {
    id: 'gd-5',
    code: 'GD-PHC',
    name_ar: 'الإدارة العامة للرعاية الأساسية وتطوير وحدات طب الأسرة',
    central_admin_id: 'ca-2',
    central_admin_name_ar: 'الإدارة المركزية للرعاية الصحية الأولية والوقائية',
    sector_name_ar: 'قطاع الرعاية الصحية وتنمية الأسرة',
    head_name_ar: 'د. هاني فتحي عبد المنعم',
    active_programs_count: 9,
  },
  {
    id: 'gd-6',
    code: 'GD-MCH',
    name_ar: 'الإدارة العامة لصحة الأم والطفل ورعاية حديثي الولادة',
    central_admin_id: 'ca-2',
    central_admin_name_ar: 'الإدارة المركزية للرعاية الصحية الأولية والوقائية',
    sector_name_ar: 'قطاع الرعاية الصحية وتنمية الأسرة',
    head_name_ar: 'د. ريهام الشافعي',
    active_programs_count: 7,
  },
  {
    id: 'gd-7',
    code: 'GD-YOUTH',
    name_ar: 'الإدارة العامة لصحة اليافعين والشباب وصحة السن المدرسي',
    central_admin_id: 'ca-2',
    central_admin_name_ar: 'الإدارة المركزية للرعاية الصحية الأولية والوقائية',
    sector_name_ar: 'قطاع الرعاية الصحية وتنمية الأسرة',
    head_name_ar: 'د. سامح رضوان فهمي',
    active_programs_count: 4,
  },
  // تابعة لـ: الإدارة المركزية للمتابعة والتقييم والمعلومات والتحول الرقمي
  {
    id: 'gd-8',
    code: 'GD-STATS',
    name_ar: 'الإدارة العامة للإحصاء والمؤشرات الرقمية والرقابة',
    central_admin_id: 'ca-3',
    central_admin_name_ar: 'الإدارة المركزية للمتابعة والتقييم والمعلومات والتحول الرقمي',
    sector_name_ar: 'قطاع الرعاية الصحية وتنمية الأسرة',
    head_name_ar: 'م. أحمد عبد السلام الجزار',
    active_programs_count: 10,
  },
  {
    id: 'gd-9',
    code: 'GD-AUDIT',
    name_ar: 'الإدارة العامة للحوكمة والتدقيق الإداري والميداني',
    central_admin_id: 'ca-3',
    central_admin_name_ar: 'الإدارة المركزية للمتابعة والتقييم والمعلومات والتحول الرقمي',
    sector_name_ar: 'قطاع الرعاية الصحية وتنمية الأسرة',
    head_name_ar: 'د. طارق سالم غنيم',
    active_programs_count: 6,
  },
];

// تم استبدال المنشآت الوهمية السابقة بمنشآت ومراكز الرعاية الأولية المعتمدة رسمياً (281 منشأة وإدارة)
const INITIAL_FACILITIES: HealthFacility[] = OFFICIAL_FACILITIES;

const STORAGE_KEYS = {
  CENTRAL_ADMINS: 'masar_hierarchy_central_admins_v2',
  GENERAL_DIRECTORATES: 'masar_hierarchy_general_directorates_v2',
  GOVERNORATES: 'masar_hierarchy_governorates_v2',
  FACILITIES: 'masar_hierarchy_facilities_v2',
};

export const OrganizationHierarchyView: React.FC<OrganizationHierarchyViewProps> = ({ user }) => {
  const [activeViewMode, setActiveViewMode] = useState<'tree' | 'directory'>('tree');

  // تحميل البيانات المحفوظة محلياً أو العودة للبيانات التأسيسية
  const [governorates, setGovernorates] = useState<typeof SAMPLE_GOVERNORATES>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEYS.GOVERNORATES);
        if (saved) return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to load saved governorates', e);
      }
    }
    return SAMPLE_GOVERNORATES;
  });

  const [generalDirectorates, setGeneralDirectorates] = useState<GeneralDirectorate[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEYS.GENERAL_DIRECTORATES);
        if (saved) return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to load saved general directorates', e);
      }
    }
    return INITIAL_GENERAL_DIRECTORATES;
  });

  const [facilities, setFacilities] = useState<HealthFacility[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEYS.FACILITIES);
        if (saved) return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to load saved facilities', e);
      }
    }
    return INITIAL_FACILITIES;
  });
  
  const [centralAdministrations, setCentralAdministrations] = useState<CentralAdministration[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEYS.CENTRAL_ADMINS);
        if (saved) return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to load saved central administrations', e);
      }
    }
    return INITIAL_CENTRAL_ADMINISTRATIONS;
  });

  // دوال الحفظ الفوري الدائم
  const updateGovernorates = (updater: React.SetStateAction<typeof SAMPLE_GOVERNORATES>) => {
    setGovernorates(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(STORAGE_KEYS.GOVERNORATES, JSON.stringify(next));
        } catch (e) {
          console.error(e);
        }
      }
      return next;
    });
  };

  const updateGeneralDirectorates = (updater: React.SetStateAction<GeneralDirectorate[]>) => {
    setGeneralDirectorates(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(STORAGE_KEYS.GENERAL_DIRECTORATES, JSON.stringify(next));
        } catch (e) {
          console.error(e);
        }
      }
      return next;
    });
  };

  const updateFacilities = (updater: React.SetStateAction<HealthFacility[]>) => {
    setFacilities(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(STORAGE_KEYS.FACILITIES, JSON.stringify(next));
        } catch (e) {
          console.error(e);
        }
      }
      return next;
    });
  };

  const updateCentralAdministrations = (updater: React.SetStateAction<CentralAdministration[]>) => {
    setCentralAdministrations(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(STORAGE_KEYS.CENTRAL_ADMINS, JSON.stringify(next));
        } catch (e) {
          console.error(e);
        }
      }
      return next;
    });
  };

  // حالات طي وتوسيع شجرة الهيكل
  const [expandedMinistry, setExpandedMinistry] = useState<boolean>(true);
  const [expandedCentralAdmins, setExpandedCentralAdmins] = useState<Record<string, boolean>>({
    'ca-1': true,
    'ca-2': true,
    'ca-3': true,
  });
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
  const [showAddCentralAdminModal, setShowAddCentralAdminModal] = useState<boolean>(false);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState<boolean>(false);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState<boolean>(false);
  const [operationFeedback, setOperationFeedback] = useState<{ type: 'success' | 'error'; title: string; message: string } | null>(null);
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
  const [newGdCentralAdminId, setNewGdCentralAdminId] = useState<string>('ca-1');

  // حالات فورم إضافة إدارة مركزية
  const [newCaName, setNewCaName] = useState<string>('');
  const [newCaCode, setNewCaCode] = useState<string>('');
  const [newCaHead, setNewCaHead] = useState<string>('');

  // حالات تعديل المنشأة الصحية والتبعية
  const [facilityToEdit, setFacilityToEdit] = useState<HealthFacility | null>(null);
  const [editFacName, setEditFacName] = useState<string>('');
  const [editFacType, setEditFacType] = useState<FacilityType>('FAMILY_HEALTH_CENTER');
  const [editFacGovId, setEditFacGovId] = useState<string>('');
  const [editFacDistId, setEditFacDistId] = useState<string>('');
  const [editFacDirector, setEditFacDirector] = useState<string>('');
  const [editFacPpfp, setEditFacPpfp] = useState<boolean>(false);
  const [editFacCounseling, setEditFacCounseling] = useState<boolean>(false);
  const [editFacStatus, setEditFacStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');

  // حالات تعديل الإدارة الصحية والتبعية
  const [districtToEdit, setDistrictToEdit] = useState<{ district: HealthDistrict; currentGovId: string } | null>(null);
  const [editDistName, setEditDistName] = useState<string>('');
  const [editDistCode, setEditDistCode] = useState<string>('');
  const [editDistGovId, setEditDistGovId] = useState<string>('');
  const [editDistDirector, setEditDistDirector] = useState<string>('');

  // حالات تعديل الإدارة المركزية
  const [caToEdit, setCaToEdit] = useState<CentralAdministration | null>(null);
  const [editCaName, setEditCaName] = useState<string>('');
  const [editCaCode, setEditCaCode] = useState<string>('');
  const [editCaHead, setEditCaHead] = useState<string>('');
  const [editCaSector, setEditCaSector] = useState<string>('');

  // حالات تعديل الإدارة العامة
  const [gdToEdit, setGdToEdit] = useState<GeneralDirectorate | null>(null);
  const [editGdName, setEditGdName] = useState<string>('');
  const [editGdCode, setEditGdCode] = useState<string>('');
  const [editGdHead, setEditGdHead] = useState<string>('');
  const [editGdCentralAdminId, setEditGdCentralAdminId] = useState<string>('');
  const [editGdProgramsCount, setEditGdProgramsCount] = useState<number>(1);

  // صلاحية الحذف والتعديل الإداري
  const isAdmin = user.role === 'super_admin' || user.role === 'sector_head' || user.role === 'central_admin';

  // حالات نافذة تأكيد الحذف
  const [itemToDelete, setItemToDelete] = useState<{
    type: 'FACILITY' | 'DISTRICT' | 'GENERAL_DIRECTORATE' | 'CENTRAL_ADMIN';
    id: string;
    name: string;
    parentId?: string;
  } | null>(null);

  // طلب حذف منشأة صحية
  const handleRequestDeleteFacility = (fac: HealthFacility) => {
    setItemToDelete({
      type: 'FACILITY',
      id: fac.id,
      name: fac.name_ar,
    });
  };

  // طلب حذف إدارة صحية (مع التحقق من عدم وجود منشآت تابعة لها)
  const handleRequestDeleteDistrict = (dist: HealthDistrict, govId: string) => {
    const distFacilities = facilities.filter(f => f.district_id === dist.id);
    if (distFacilities.length > 0) {
      setOperationFeedback({
        type: 'error',
        title: 'تعذر حذف الإدارة الصحية',
        message: `لا يمكن حذف الإدارة الصحية (${dist.name_ar}) لوجود (${distFacilities.length}) منشأة صحية مسجلة تابعة لها. يُرجى نقل المنشآت التابعة لها أو حذفها أولاً لتفريغ الإدارة.`,
      });
      return;
    }
    setItemToDelete({
      type: 'DISTRICT',
      id: dist.id,
      name: dist.name_ar,
      parentId: govId,
    });
  };

  // طلب حذف إدارة عامة
  const handleRequestDeleteGeneralDirectorate = (gd: GeneralDirectorate) => {
    setItemToDelete({
      type: 'GENERAL_DIRECTORATE',
      id: gd.id,
      name: gd.name_ar,
    });
  };

  // طلب حذف إدارة مركزية (مع التحقق من عدم وجود إدارات عامة تابعة لها)
  const handleRequestDeleteCentralAdmin = (ca: CentralAdministration) => {
    const caDirectorates = generalDirectorates.filter(
      gd => gd.central_admin_id === ca.id || gd.central_admin_name_ar === ca.name_ar
    );
    if (caDirectorates.length > 0) {
      setOperationFeedback({
        type: 'error',
        title: 'تعذر حذف الإدارة المركزية',
        message: `لا يمكن حذف الإدارة المركزية (${ca.name_ar}) لوجود (${caDirectorates.length}) إدارات عامة فنية تابعة لها. يُرجى نقل الإدارات العامة أولاً أو حذفها.`,
      });
      return;
    }
    setItemToDelete({
      type: 'CENTRAL_ADMIN',
      id: ca.id,
      name: ca.name_ar,
    });
  };

  // تأكيد الحذف النهائي
  const handleConfirmDelete = () => {
    if (!itemToDelete) return;

    if (itemToDelete.type === 'FACILITY') {
      updateFacilities(prev => prev.filter(f => f.id !== itemToDelete.id));
      setOperationFeedback({
        type: 'success',
        title: 'تم حذف المنشأة الصحية',
        message: `تم حذف المنشأة (${itemToDelete.name}) بنجاح من الهيكل التنظيمي.`,
      });
    } else if (itemToDelete.type === 'DISTRICT') {
      updateGovernorates(prevGovs => prevGovs.map(g => {
        if (g.id === itemToDelete.parentId) {
          return {
            ...g,
            districts: (g.districts || []).filter(d => d.id !== itemToDelete.id),
          };
        }
        return g;
      }));
      setOperationFeedback({
        type: 'success',
        title: 'تم حذف الإدارة الصحية',
        message: `تم حذف الإدارة الصحية (${itemToDelete.name}) بنجاح من المحافظة.`,
      });
    } else if (itemToDelete.type === 'GENERAL_DIRECTORATE') {
      updateGeneralDirectorates(prev => prev.filter(gd => gd.id !== itemToDelete.id));
      setOperationFeedback({
        type: 'success',
        title: 'تم حذف الإدارة العامة',
        message: `تم حذف الإدارة العامة (${itemToDelete.name}) بنجاح.`,
      });
    } else if (itemToDelete.type === 'CENTRAL_ADMIN') {
      updateCentralAdministrations(prev => prev.filter(ca => ca.id !== itemToDelete.id));
      setOperationFeedback({
        type: 'success',
        title: 'تم حذف الإدارة المركزية',
        message: `تم حذف الإدارة المركزية (${itemToDelete.name}) بنجاح.`,
      });
    }

    setItemToDelete(null);
  };

  // فتح نافذة تعديل منشأة
  const openEditFacility = (fac: HealthFacility) => {
    setFacilityToEdit(fac);
    setEditFacName(fac.name_ar);
    setEditFacType(fac.facility_type);
    setEditFacGovId(fac.governorate_id);
    setEditFacDistId(fac.district_id);
    setEditFacDirector(fac.director_name_ar || '');
    setEditFacPpfp(fac.has_ppfp_service);
    setEditFacCounseling(fac.has_counseling_room);
    setEditFacStatus(fac.status);
  };

  // حفظ تعديل منشأة وتبعيّتها
  const handleSaveFacilityEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!facilityToEdit || !editFacName.trim()) return;

    const targetGov = governorates.find(g => g.id === editFacGovId);
    const targetDist = targetGov?.districts?.find(d => d.id === editFacDistId);

    const typeArMap: Record<FacilityType, string> = {
      'FAMILY_HEALTH_UNIT': 'وحدة صحة أسرة',
      'FAMILY_HEALTH_CENTER': 'مركز طب أسرة حضري',
      'MATERNITY_HOSPITAL': 'مستشفى ولادة ونساء (PPFP)',
      'GENERAL_HOSPITAL': 'مستشفى عام / مركزي',
      'MOBILE_CLINIC': 'عيادة متنقلة',
    };

    updateFacilities(prev => prev.map(f => {
      if (f.id === facilityToEdit.id) {
        return {
          ...f,
          name_ar: editFacName.trim(),
          facility_type: editFacType,
          facility_type_ar: typeArMap[editFacType],
          governorate_id: editFacGovId,
          governorate_name_ar: targetGov?.name_ar || f.governorate_name_ar,
          district_id: editFacDistId,
          district_name_ar: targetDist?.name_ar || f.district_name_ar,
          director_name_ar: editFacDirector.trim(),
          has_ppfp_service: editFacPpfp,
          has_counseling_room: editFacCounseling,
          status: editFacStatus,
        };
      }
      return f;
    }));

    setFacilityToEdit(null);
    setOperationFeedback({
      type: 'success',
      title: 'تم تعديل بيانات المنشأة والتبعية',
      message: `تم تحديث المنشأة (${editFacName.trim()}) وتعديل تبعيتها الإدارية بنجاح.`,
    });
  };

  // فتح نافذة تعديل إدارة صحية
  const openEditDistrict = (dist: HealthDistrict, currentGovId: string) => {
    setDistrictToEdit({ district: dist, currentGovId });
    setEditDistName(dist.name_ar);
    setEditDistCode(dist.code);
    setEditDistGovId(currentGovId);
    setEditDistDirector(dist.director_name_ar || '');
  };

  // حفظ تعديل الإدارة الصحية ونقل التبعية إذا لزم الأمر
  const handleSaveDistrictEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!districtToEdit || !editDistName.trim()) return;

    const { district, currentGovId } = districtToEdit;
    const targetGovId = editDistGovId;
    const newDistName = editDistName.trim();
    const newDistCode = editDistCode.trim() || district.code;
    const newDistDirector = editDistDirector.trim();

    updateGovernorates(prevGovs => {
      const updated = prevGovs.map(g => ({
        ...g,
        districts: g.districts ? [...g.districts] : []
      }));

      if (currentGovId === targetGovId) {
        // تعديل في نفس المحافظة
        const gov = updated.find(g => g.id === targetGovId);
        if (gov && gov.districts) {
          const dIdx = gov.districts.findIndex(d => d.id === district.id);
          if (dIdx !== -1) {
            gov.districts[dIdx] = {
              ...gov.districts[dIdx],
              name_ar: newDistName,
              code: newDistCode,
              director_name_ar: newDistDirector
            };
          }
        }
      } else {
        // نقل تبعية الإدارة لمحافظة أخرى
        const oldGov = updated.find(g => g.id === currentGovId);
        const newGov = updated.find(g => g.id === targetGovId);
        if (oldGov && oldGov.districts && newGov) {
          oldGov.districts = oldGov.districts.filter(d => d.id !== district.id);
          if (!newGov.districts) newGov.districts = [];
          newGov.districts.push({
            ...district,
            name_ar: newDistName,
            code: newDistCode,
            governorate_id: targetGovId,
            director_name_ar: newDistDirector
          });
        }
      }

      return updated;
    });

    // تحديث كافة المنشآت التابعة لهذه الإدارة
    const targetGovObj = governorates.find(g => g.id === targetGovId);
    updateFacilities(prevFacs => prevFacs.map(f => {
      if (f.district_id === district.id) {
        return {
          ...f,
          district_name_ar: newDistName,
          governorate_id: targetGovId,
          governorate_name_ar: targetGovObj?.name_ar || f.governorate_name_ar,
        };
      }
      return f;
    }));

    setDistrictToEdit(null);
    setOperationFeedback({
      type: 'success',
      title: 'تم تعديل الإدارة الصحية والتبعية الإدارية',
      message: `تم تحديث بيانات (${newDistName}) والتبعية بنجاح.`,
    });
  };

  // فتح نافذة تعديل إدارة مركزية
  const openEditCentralAdmin = (ca: CentralAdministration) => {
    setCaToEdit(ca);
    setEditCaName(ca.name_ar);
    setEditCaCode(ca.code);
    setEditCaHead(ca.head_name_ar || '');
    setEditCaSector(ca.sector_name_ar || 'قطاع الرعاية الصحية وتنمية الأسرة');
  };

  // حفظ تعديل الإدارة المركزية
  const handleSaveCentralAdminEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!caToEdit || !editCaName.trim()) return;

    const oldName = caToEdit.name_ar;
    const newName = editCaName.trim();
    const newCode = editCaCode.trim() || caToEdit.code;
    const newHead = editCaHead.trim();
    const newSector = editCaSector.trim() || 'قطاع الرعاية الصحية وتنمية الأسرة';

    updateCentralAdministrations(prev => prev.map(ca => {
      if (ca.id === caToEdit.id) {
        return {
          ...ca,
          name_ar: newName,
          code: newCode,
          head_name_ar: newHead,
          sector_name_ar: newSector,
        };
      }
      return ca;
    }));

    // تحديث اسم الإدارة المركزية في أي إدارة عامة تابعة لها
    if (oldName !== newName) {
      updateGeneralDirectorates(prevGds => prevGds.map(gd => {
        if (gd.central_admin_id === caToEdit.id || gd.central_admin_name_ar === oldName) {
          return {
            ...gd,
            central_admin_name_ar: newName,
          };
        }
        return gd;
      }));
    }

    setCaToEdit(null);
    setOperationFeedback({
      type: 'success',
      title: 'تم تعديل الإدارة المركزية',
      message: `تم تحديث بيانات الإدارة المركزية (${newName}) بنجاح.`,
    });
  };

  // فتح نافذة تعديل إدارة عامة
  const openEditGeneralDirectorate = (gd: GeneralDirectorate) => {
    setGdToEdit(gd);
    setEditGdName(gd.name_ar);
    setEditGdCode(gd.code);
    setEditGdHead(gd.head_name_ar || '');
    setEditGdCentralAdminId(gd.central_admin_id || 'ca-1');
    setEditGdProgramsCount(gd.active_programs_count || 1);
  };

  // حفظ تعديل الإدارة العامة
  const handleSaveGeneralDirectorateEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gdToEdit || !editGdName.trim()) return;

    const targetCa = centralAdministrations.find(ca => ca.id === editGdCentralAdminId) || centralAdministrations[0];
    const newName = editGdName.trim();
    const newCode = editGdCode.trim() || gdToEdit.code;
    const newHead = editGdHead.trim();
    const newProgramsCount = Number(editGdProgramsCount) || 0;

    updateGeneralDirectorates(prevGds => prevGds.map(gd => {
      if (gd.id === gdToEdit.id) {
        return {
          ...gd,
          name_ar: newName,
          code: newCode,
          head_name_ar: newHead,
          central_admin_id: targetCa?.id || gd.central_admin_id,
          central_admin_name_ar: targetCa?.name_ar || gd.central_admin_name_ar,
          active_programs_count: newProgramsCount,
        };
      }
      return gd;
    }));

    setGdToEdit(null);
    setOperationFeedback({
      type: 'success',
      title: 'تم تعديل الإدارة العامة',
      message: `تم تحديث بيانات الإدارة العامة (${newName}) بنجاح.`,
    });
  };

  // استعادة الهيكل التنظيمي الافتراضي
  const handleResetHierarchyToDefault = () => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(STORAGE_KEYS.CENTRAL_ADMINS);
        localStorage.removeItem(STORAGE_KEYS.GENERAL_DIRECTORATES);
        localStorage.removeItem(STORAGE_KEYS.GOVERNORATES);
        localStorage.removeItem(STORAGE_KEYS.FACILITIES);
      } catch (e) {
        console.error('Failed to clear hierarchy localStorage', e);
      }
    }
    setCentralAdministrations(INITIAL_CENTRAL_ADMINISTRATIONS);
    setGeneralDirectorates(INITIAL_GENERAL_DIRECTORATES);
    setGovernorates(SAMPLE_GOVERNORATES);
    setFacilities(INITIAL_FACILITIES);
    setShowResetConfirmModal(false);
    setOperationFeedback({
      type: 'success',
      title: 'تمت استعادة الهيكل الافتراضي',
      message: 'تمت استعادة كافة الإدارات المركزية والعامة والمديريات والمنشآت إلى وضعها المعتمد الافتراضي بنجاح.',
    });
  };

  // حالات البحث والفلترة في الدليل
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedGovFilter, setSelectedGovFilter] = useState<string>('ALL');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('ALL');

  const toggleCentralAdmin = (caId: string) => {
    setExpandedCentralAdmins(prev => ({ ...prev, [caId]: !prev[caId] }));
  };

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

    updateGovernorates(prevGovs => {
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
          updateFacilities(prevFacs => {
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

    updateFacilities(prev => [newFacility, ...prev]);
    setShowAddFacilityModal(false);
    setNewFacName('');
    setOperationFeedback({
      type: 'success',
      title: 'تمت إضافة المنشأة الصحية',
      message: `تمت إضافة المنشأة الصحية (${newFacility.name_ar}) إلى الهيكل التنظيمي بنجاح.`,
    });
  };

  // إضافة إدارة عامة بديوان الوزارة
  const handleCreateGeneralDirectorate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGdName.trim()) return;

    const targetCa = centralAdministrations.find(ca => ca.id === newGdCentralAdminId) || centralAdministrations[0];

    const newGd: GeneralDirectorate = {
      id: `gd-${Date.now()}`,
      code: newGdCode.trim() || `GD-${Date.now()}`,
      name_ar: newGdName.trim(),
      central_admin_id: targetCa?.id || 'ca-1',
      central_admin_name_ar: targetCa?.name_ar || 'الإدارة المركزية لتنظيم وتنمية الأسرة',
      sector_name_ar: 'قطاع الرعاية الصحية وتنمية الأسرة',
      head_name_ar: newGdHead.trim() || 'قيد التكليف',
      active_programs_count: 1,
    };

    updateGeneralDirectorates(prev => [...prev, newGd]);
    setShowAddGeneralDirectorateModal(false);
    setNewGdName('');
    setNewGdCode('');
    setNewGdHead('');
    setOperationFeedback({
      type: 'success',
      title: 'تم استحداث الإدارة العامة',
      message: `تمت إضافة (${newGd.name_ar}) تحت مظلة (${newGd.central_admin_name_ar}) بنجاح.`,
    });
  };

  // إضافة إدارة مركزية بديوان الوزارة
  const handleCreateCentralAdministration = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCaName.trim()) return;

    const newCa: CentralAdministration = {
      id: `ca-${Date.now()}`,
      code: newCaCode.trim() || `CA-${Date.now()}`,
      name_ar: newCaName.trim(),
      sector_name_ar: 'قطاع الرعاية الصحية وتنمية الأسرة',
      head_name_ar: newCaHead.trim() || 'قيد التكليف',
    };

    updateCentralAdministrations(prev => [...prev, newCa]);
    setExpandedCentralAdmins(prev => ({ ...prev, [newCa.id]: true }));
    setShowAddCentralAdminModal(false);
    setNewCaName('');
    setNewCaCode('');
    setNewCaHead('');
    setOperationFeedback({
      type: 'success',
      title: 'تم استحداث الإدارة المركزية',
      message: `تمت إضافة (${newCa.name_ar}) إلى الهيكل التنظيمي للقطاع بنجاح.`,
    });
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
    <div className="space-y-4">
      
      {/* 1. الترويسة الرئيسية للهيكل التنظيمي وإدارة المنشآت */}
      <div className="gov-surface p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-200">
              <Network className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                الهيكل التنظيمي وإدارة المنشآت الصحية
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
              <span>الهيكل الإداري والميداني</span>
            </button>
            <button
              onClick={() => setActiveViewMode('directory')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                activeViewMode === 'directory' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-[#087f78]" />
              <span>دليل المنشآت والوحدات ({facilities.length})</span>
            </button>
          </div>

          <button
            onClick={() => setShowBulkUploadModal(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 transition shadow-xs cursor-pointer"
            title="استيراد وتحديث كشف الإدارات والمديريات عبر نموذج إكسيل"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>رفع كشف الإدارات (Excel)</span>
          </button>

          <button
            onClick={() => setShowAddFacilityModal(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#087f78] hover:bg-[#066560] text-white flex items-center gap-1.5 transition shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>إضافة منشأة صحية</span>
          </button>

          <button
            onClick={() => setShowAddGeneralDirectorateModal(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white flex items-center gap-1.5 transition shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>إضافة إدارة عامة</span>
          </button>

          <button
            onClick={() => setShowAddCentralAdminModal(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 flex items-center gap-1.5 transition shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-slate-600" />
            <span>إضافة إدارة مركزية</span>
          </button>

          {isAdmin && (
            <button
              onClick={() => setShowResetConfirmModal(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 flex items-center gap-1.5 transition shadow-xs cursor-pointer"
              title="استعادة الهيكل التنظيمي الأصلي الافتراضي"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>استعادة الافتراضي</span>
            </button>
          )}
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
          <div className="text-xl font-black font-mono text-[#087f78]">1</div>
          <span className="text-[10px] text-slate-500">الرعاية وتنمية الأسرة</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-slate-400 mb-1 font-semibold">الإدارات المركزية</div>
          <div className="text-xl font-black font-mono text-[#087f78]">{centralAdministrations.length}</div>
          <span className="text-[10px] text-slate-500">إدارات مركزية تخصصية</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-slate-400 mb-1 font-semibold">الإدارات العامة الفنية</div>
          <div className="text-xl font-black font-mono text-slate-800">{generalDirectorates.length}</div>
          <span className="text-[10px] text-slate-500">بديوان عام الوزارة</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-slate-400 mb-1 font-semibold">مديريات الشئون الصحية</div>
          <div className="text-xl font-black font-mono text-[#087f78]">{governorates.length}</div>
          <span className="text-[10px] text-emerald-700 font-bold">27 محافظة كاملة</span>
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
        <div className="gov-surface p-6 shadow-xs space-y-6">
          
          <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Network className="w-4 h-4 text-[#087f78]" />
              <span>هيكل التبعية الإدارية وقائمة المنشآت</span>
            </h3>
          </div>

          <div className="space-y-5 text-xs font-medium">
            
            {/* المستوى 1: ديوان عام وزارة الصحة والسكان - قطاع الرعاية الصحية وتنمية الأسرة */}
            <div className="border-2 border-teal-200 bg-teal-50/40 rounded-2xl p-4 space-y-4">
              <div 
                onClick={() => setExpandedMinistry(!expandedMinistry)}
                className="flex items-center justify-between cursor-pointer select-none"
              >
                <div className="flex items-center gap-2.5">
                  {expandedMinistry ? <ChevronDown className="w-4 h-4 text-[#087f78]" /> : <ChevronRight className="w-4 h-4 text-[#087f78]" />}
                  <span className="p-1.5 rounded-lg bg-[#087f78] text-white font-black text-xs">ديوان الوزارة</span>
                  <span className="text-sm font-extrabold text-[#172033]">قطاع الرعاية الصحية وتنمية الأسرة</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-teal-100 text-[#066560] font-bold">
                    {centralAdministrations.length} إدارات مركزية • {generalDirectorates.length} إدارات عامة
                  </span>
                </div>
              </div>

              {expandedMinistry && (
                <div className="pr-6 space-y-3.5 pt-2 border-r-2 border-teal-300 mr-2">
                  
                  {/* الإدارات المركزية التابعة للقطاع */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-600 font-bold pb-1 border-b border-teal-200/60">
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-[#087f78]" />
                        <span>الإدارات المركزية التابعة لقطاع الرعاية الصحية وتنمية الأسرة ({centralAdministrations.length})</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-semibold">مستوى الإدارات المركزية</span>
                    </div>

                    {centralAdministrations.map(ca => {
                      const isCaExpanded = !!expandedCentralAdmins[ca.id];
                      const caDirectorates = generalDirectorates.filter(
                        gd => gd.central_admin_id === ca.id || gd.central_admin_name_ar === ca.name_ar
                      );

                      return (
                        <div key={ca.id} className="border border-slate-200 bg-white rounded-xl p-3.5 space-y-2.5 shadow-2xs">
                          <div 
                            onClick={() => toggleCentralAdmin(ca.id)}
                            className="flex items-center justify-between cursor-pointer select-none"
                          >
                            <div className="flex items-center gap-2">
                              {isCaExpanded ? <ChevronDown className="w-4 h-4 text-[#087f78]" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                              <span className="p-1 rounded bg-teal-50 text-[#087f78] border border-teal-200 text-[10px] font-bold font-mono">
                                {ca.code}
                              </span>
                              <span className="font-extrabold text-[#172033] text-xs">{ca.name_ar}</span>
                              <span className="text-[11px] text-slate-500 font-mono">(رئيس الإدارة المركزية: {ca.head_name_ar})</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold border border-slate-200">
                                {caDirectorates.length} إدارات عامة فنية
                              </span>
                              {isAdmin && (
                                <>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openEditCentralAdmin(ca);
                                    }}
                                    className="p-1 px-2 rounded-md text-[11px] font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 transition flex items-center gap-1 cursor-pointer"
                                    title="تعديل بيانات الإدارة المركزية"
                                  >
                                    <Edit3 className="w-3 h-3" />
                                    <span>تعديل</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRequestDeleteCentralAdmin(ca);
                                    }}
                                    className="p-1 px-1.5 rounded text-[10px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition flex items-center gap-1 cursor-pointer"
                                    title="حذف الإدارة المركزية"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    <span>حذف</span>
                                  </button>
                                </>
                              )}
                            </div>
                          </div>

                          {/* الإدارات العامة التابعة لهذه الإدارة المركزية */}
                          {isCaExpanded && (
                            <div className="pr-5 space-y-2 pt-2 border-r-2 border-teal-200 mr-2">
                              {caDirectorates.length > 0 ? (
                                caDirectorates.map(gd => (
                                  <div key={gd.id} className="p-2.5 rounded-lg bg-slate-50/70 border border-slate-200 flex items-center justify-between text-xs hover:border-slate-300 transition">
                                    <div className="flex items-center gap-2">
                                      <Building2 className="w-3.5 h-3.5 text-[#087f78]" />
                                      <span className="font-bold text-slate-800">{gd.name_ar}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-[11px] text-slate-600 font-medium">
                                        المدير العام المكلف: <strong className="text-slate-800">{gd.head_name_ar}</strong>
                                      </span>
                                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-white text-slate-600 border border-slate-200 font-mono">
                                        {gd.active_programs_count} برامج
                                      </span>
                                      {isAdmin && (
                                        <>
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              openEditGeneralDirectorate(gd);
                                            }}
                                            className="p-1 px-1.5 rounded text-[10px] font-bold text-teal-800 bg-white hover:bg-teal-50 border border-teal-200 transition flex items-center gap-1 cursor-pointer"
                                            title="تعديل بيانات الإدارة العامة"
                                          >
                                            <Edit3 className="w-2.5 h-2.5" />
                                            <span>تعديل</span>
                                          </button>
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleRequestDeleteGeneralDirectorate(gd);
                                            }}
                                            className="p-1 px-1.5 rounded text-[10px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition flex items-center gap-1 cursor-pointer"
                                            title="حذف الإدارة العامة"
                                          >
                                            <Trash2 className="w-2.5 h-2.5" />
                                            <span>حذف</span>
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="text-[11px] text-slate-400 py-1 font-medium">
                                  لا توجد إدارات عامة مسجلة تحت هذه الإدارة المركزية بعد.
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                </div>
              )}
            </div>

            {/* المستوى 2: مديريات الشئون الصحية بالمحافظات (27 محافظة في مصر) */}
            <div className="border border-slate-200 bg-white rounded-2xl p-4 space-y-3.5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-teal-50 text-[#087f78] border border-teal-200 flex items-center justify-center">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-[#172033]">
                      مديريات الشئون الصحية بالمحافظات
                    </h4>
                  </div>
                </div>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                  {governorates.length} محافظة مسجلة بالكامل
                </span>
              </div>

              <div className="space-y-2 pt-1 max-h-[70vh] overflow-y-auto pr-1">
                {governorates.map(gov => {
                  const isGovExpanded = !!expandedGovs[gov.id];
                  const govFacs = facilities.filter(f => f.governorate_id === gov.id);
                  const districtsCount = gov.districts?.length || 0;

                  return (
                    <div key={gov.id} className="bg-slate-50/50 border border-slate-200 rounded-xl p-3 space-y-2 hover:border-slate-300 transition">
                      <div 
                        onClick={() => toggleGov(gov.id)}
                        className="flex items-center justify-between cursor-pointer select-none"
                      >
                        <div className="flex items-center gap-2">
                          {isGovExpanded ? <ChevronDown className="w-4 h-4 text-[#087f78]" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                          <span className="font-bold text-slate-900 text-xs">مديرية الشئون الصحية بمحافظة {gov.name_ar}</span>
                        </div>
                        <span className="text-[11px] font-mono text-slate-500">
                          {districtsCount} إدارات صحية • {govFacs.length} منشأة
                        </span>
                      </div>

                      {/* المستوى 3: الإدارات الصحية التابعة لمديرية الشئون الصحية بكل محافظة */}
                      {isGovExpanded && gov.districts && (
                        <div className="pr-5 space-y-2 pt-2 border-r-2 border-[#a8ddd7] mr-2">
                          <div className="text-[11px] font-bold text-[#087f78] pb-1">
                            الإدارات الصحية التابعة لمديرية الشئون الصحية بمحافظة {gov.name_ar} ({districtsCount} إدارة):
                          </div>

                          {gov.districts.map(dist => {
                            const isDistExpanded = !!expandedDistricts[dist.id];
                            const distFacilities = facilities.filter(f => f.district_id === dist.id);

                            return (
                              <div key={dist.id} className="p-2.5 rounded-lg bg-white border border-slate-200 space-y-2 shadow-2xs">
                                <div 
                                  onClick={() => toggleDistrict(dist.id)}
                                  className="flex items-center justify-between cursor-pointer select-none"
                                >
                                  <div className="flex items-center gap-2">
                                    {isDistExpanded ? <ChevronDown className="w-3.5 h-3.5 text-emerald-600" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                                    <Building className="w-3.5 h-3.5 text-emerald-600" />
                                    <span className="font-bold text-slate-800">{dist.name_ar}</span>
                                    {dist.director_name_ar ? (
                                      <span className="text-[10px] text-slate-500 font-medium mr-1">
                                        (المدير: {dist.director_name_ar})
                                      </span>
                                    ) : null}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openEditDistrict(dist, gov.id);
                                      }}
                                      className="p-1 px-2 rounded-md text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition flex items-center gap-1 cursor-pointer"
                                      title="تعديل اسم الإدارة الصحية والتبعية للمحافظة"
                                    >
                                      <Edit3 className="w-3 h-3" />
                                      <span>تعديل التبعية والاسم</span>
                                    </button>
                                    {isAdmin && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleRequestDeleteDistrict(dist, gov.id);
                                        }}
                                        className="p-1 px-2 rounded-md text-[11px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition flex items-center gap-1 cursor-pointer"
                                        title="حذف الإدارة الصحية"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                        <span>حذف</span>
                                      </button>
                                    )}
                                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold font-mono">
                                      {distFacilities.length} منشأة
                                    </span>
                                  </div>
                                </div>

                                {/* المستوى 4: الوحدات والمراكز التابعة للإدارة الصحية */}
                                {isDistExpanded && (
                                  <div className="pr-4 space-y-1.5 pt-1 border-r-2 border-emerald-300 mr-2">
                                    {distFacilities.length > 0 ? (
                                      distFacilities.map(fac => (
                                        <div key={fac.id} className="p-2 rounded bg-slate-50 border border-slate-200 flex items-center justify-between text-xs hover:border-slate-300 transition">
                                          <div className="flex items-center gap-2">
                                            {fac.facility_type === 'MATERNITY_HOSPITAL' ? <Baby className="w-3.5 h-3.5 text-indigo-600" /> :
                                             fac.facility_type === 'GENERAL_HOSPITAL' ? <Hospital className="w-3.5 h-3.5 text-rose-600" /> :
                                             <Home className="w-3.5 h-3.5 text-[#087f78]" />}
                                            <span className="font-bold text-slate-800">{fac.name_ar}</span>
                                            <span className="text-[10px] text-slate-400">({fac.facility_type_ar})</span>
                                            {fac.director_name_ar ? (
                                              <span className="text-[10px] text-slate-500 font-medium">
                                                • المدير: {fac.director_name_ar}
                                              </span>
                                            ) : null}
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
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                openEditFacility(fac);
                                              }}
                                              className="p-1 px-1.5 rounded text-[10px] font-bold text-[#087f78] bg-white border border-teal-200 hover:bg-teal-50 transition flex items-center gap-1 cursor-pointer"
                                              title="تعديل المنشأة والتبعية"
                                            >
                                              <Edit3 className="w-2.5 h-2.5" />
                                              <span>تعديل</span>
                                            </button>
                                            {isAdmin && (
                                              <button
                                                type="button"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleRequestDeleteFacility(fac);
                                                }}
                                                className="p-1 px-1.5 rounded text-[10px] font-bold text-rose-700 bg-white border border-rose-200 hover:bg-rose-50 transition flex items-center gap-1 cursor-pointer"
                                                title="حذف المنشأة الصحية"
                                              >
                                                <Trash2 className="w-2.5 h-2.5" />
                                                <span>حذف</span>
                                              </button>
                                            )}
                                          </div>
                                        </div>
                                      ))
                                    ) : (
                                      <div className="text-[11px] text-slate-400 py-1">
                                        لا توجد منشآت مسجلة بهذه الإدارة بعد. انقر زر «إضافة منشأة صحية» لإدراج الوحدات والمراكز.
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

        </div>
      ) : (
        /* 4. النمط الثاني: جدول إدارة المنشآت والوحدات الصحية والبحث المتقدم */
        <div className="gov-surface p-6 shadow-xs space-y-4">
          
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
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs p-2.5 pr-8 rounded-xl font-medium focus:outline-none focus:border-[#087f78]"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3.5" />
            </div>

            <div>
              <select
                value={selectedGovFilter}
                onChange={(e) => setSelectedGovFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs p-2.5 rounded-xl font-medium focus:outline-none focus:border-[#087f78]"
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
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs p-2.5 rounded-xl font-medium focus:outline-none focus:border-[#087f78]"
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
                  <th className="p-3">المدير المسؤول</th>
                  <th className="p-3 text-center">خدمة PPFP</th>
                  <th className="p-3 text-center">غرفة مشورة</th>
                  <th className="p-3 text-center">الحالة</th>
                  <th className="p-3 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredFacilities.map((fac, idx) => (
                  <tr key={fac.id} className="hover:bg-slate-50/70 transition">
                    <td className="p-2.5 text-center font-bold font-mono text-slate-400">{idx + 1}</td>
                    <td className="p-2.5 font-bold text-slate-900 flex items-center gap-2">
                      {fac.facility_type === 'MATERNITY_HOSPITAL' ? <Baby className="w-3.5 h-3.5 text-indigo-600" /> :
                       fac.facility_type === 'GENERAL_HOSPITAL' ? <Hospital className="w-3.5 h-3.5 text-rose-600" /> :
                       <Home className="w-3.5 h-3.5 text-[#087f78]" />}
                      <span>{fac.name_ar}</span>
                    </td>
                    <td className="p-2.5 text-slate-600 font-medium">{fac.facility_type_ar}</td>
                    <td className="p-2.5 text-slate-700">{fac.district_name_ar}</td>
                    <td className="p-2.5 text-slate-700">{fac.governorate_name_ar}</td>
                    <td className="p-2.5 text-slate-600">
                      {fac.director_name_ar && fac.director_name_ar.trim() ? (
                        <span className="font-semibold text-slate-800">{fac.director_name_ar}</span>
                      ) : (
                        <span className="text-slate-400 italic text-[10px]">غير محدد (فارغ)</span>
                      )}
                    </td>
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
                      {fac.status === 'ACTIVE' ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">نشطة</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold text-[10px]">معطلة</span>
                      )}
                    </td>
                    <td className="p-2.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => openEditFacility(fac)}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold text-[#087f78] bg-teal-50 hover:bg-teal-100 transition inline-flex items-center gap-1 cursor-pointer border border-teal-200/60"
                          title="تعديل اسم المنشأة والتبعية"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>تعديل</span>
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => handleRequestDeleteFacility(fac)}
                            className="px-2.5 py-1 rounded-lg text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 transition inline-flex items-center gap-1 cursor-pointer border border-rose-200"
                            title="حذف المنشأة الصحية"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>حذف</span>
                          </button>
                        )}
                      </div>
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
        <div 
          className="fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-[2px] flex items-center justify-center p-3 sm:p-5 animate-in fade-in"
          onClick={() => setShowAddFacilityModal(false)}
        >
          <div 
            className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 max-w-lg w-full shadow-2xl relative space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowAddFacilityModal(false)}
              className="absolute left-5 top-5 text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition"
              title="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="p-2 rounded-xl bg-teal-50 text-[#087f78] border border-teal-200">
                <Hospital className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#172033]">إضافة منشأة صحية جديدة للهيكل</h3>
                <p className="text-xs text-slate-500">تسجيل وحدة رعاية أولية أو مركز أو مستشفى توليد</p>
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
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium focus:outline-none focus:border-[#087f78]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">نوع المنشأة:</label>
                  <select
                    value={newFacType}
                    onChange={(e) => setNewFacType(e.target.value as FacilityType)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium focus:outline-none focus:border-[#087f78]"
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
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium focus:outline-none focus:border-[#087f78]"
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
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium focus:outline-none focus:border-[#087f78]"
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
                    className="w-4 h-4 rounded text-[#087f78] focus:ring-[#087f78]"
                  />
                  <span className="font-bold text-slate-800">توفر خدمة تركيب اللوالب أثناء القيصرية والولادة (PPFP)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newFacCounseling}
                    onChange={(e) => setNewFacCounseling(e.target.checked)}
                    className="w-4 h-4 rounded text-[#087f78] focus:ring-[#087f78]"
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
                  className="px-5 py-2.5 rounded-xl bg-[#087f78] hover:bg-[#066560] text-white font-bold transition shadow-xs"
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
        <div 
          className="fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-[2px] flex items-center justify-center p-3 sm:p-5 animate-in fade-in"
          onClick={() => setShowAddGeneralDirectorateModal(false)}
        >
          <div 
            className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 max-w-md w-full shadow-2xl relative space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowAddGeneralDirectorateModal(false)}
              className="absolute left-5 top-5 text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition"
              title="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="p-2 rounded-xl bg-teal-50 text-[#087f78] border border-teal-200">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#172033]">إضافة إدارة عامة بديوان الوزارة</h3>
                <p className="text-xs text-slate-500">استحداث إدارة عامة تحت قطاع الرعاية وتنمية الأسرة</p>
              </div>
            </div>

            <form onSubmit={handleCreateGeneralDirectorate} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">الإدارة المركزية التابع لها:</label>
                <select
                  value={newGdCentralAdminId}
                  onChange={(e) => setNewGdCentralAdminId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium focus:outline-none focus:border-[#087f78]"
                >
                  {centralAdministrations.map(ca => (
                    <option key={ca.id} value={ca.id}>{ca.name_ar}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">اسم الإدارة العامة:</label>
                <input
                  type="text"
                  required
                  value={newGdName}
                  onChange={(e) => setNewGdName(e.target.value)}
                  placeholder="مثال: الإدارة العامة لصحة اليافعين والشباب"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium focus:outline-none focus:border-[#087f78]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">الكود التنظيمي للإدارة:</label>
                <input
                  type="text"
                  value={newGdCode}
                  onChange={(e) => setNewGdCode(e.target.value)}
                  placeholder="مثال: GD-YOUTH"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-mono focus:outline-none focus:border-[#087f78]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">اسم المدير العام المكلف:</label>
                <input
                  type="text"
                  value={newGdHead}
                  onChange={(e) => setNewGdHead(e.target.value)}
                  placeholder="مثال: د. هاني فتحي عبد المنعم"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium focus:outline-none focus:border-[#087f78]"
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
                  className="px-5 py-2.5 rounded-xl bg-[#087f78] hover:bg-[#066560] text-white font-bold transition shadow-xs"
                >
                  إدراج الإدارة العامة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. نافذة منبثقة: إضافة إدارة مركزية بديوان الوزارة (Add Central Administration Modal) */}
      {showAddCentralAdminModal && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-[2px] flex items-center justify-center p-3 sm:p-5 animate-in fade-in"
          onClick={() => setShowAddCentralAdminModal(false)}
        >
          <div 
            className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 max-w-md w-full shadow-2xl relative space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowAddCentralAdminModal(false)}
              className="absolute left-5 top-5 text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition"
              title="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="p-2 rounded-xl bg-teal-50 text-[#087f78] border border-teal-200">
                <Building className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#172033]">إضافة إدارة مركزية بديوان الوزارة</h3>
                <p className="text-xs text-slate-500">استحداث إدارة مركزية تابعة لقطاع الرعاية وتنمية الأسرة</p>
              </div>
            </div>

            <form onSubmit={handleCreateCentralAdministration} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">اسم الإدارة المركزية:</label>
                <input
                  type="text"
                  required
                  value={newCaName}
                  onChange={(e) => setNewCaName(e.target.value)}
                  placeholder="مثال: الإدارة المركزية للرعاية المتكاملة"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium focus:outline-none focus:border-[#087f78]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">الكود التنظيمي للإدارة المركزية:</label>
                <input
                  type="text"
                  value={newCaCode}
                  onChange={(e) => setNewCaCode(e.target.value)}
                  placeholder="مثال: CA-INT"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-mono focus:outline-none focus:border-[#087f78]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">اسم رئيس الإدارة المركزية المكلف:</label>
                <input
                  type="text"
                  value={newCaHead}
                  onChange={(e) => setNewCaHead(e.target.value)}
                  placeholder="مثال: د. شريف أحمد النجار"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium focus:outline-none focus:border-[#087f78]"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddCentralAdminModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#087f78] hover:bg-[#066560] text-white font-bold transition shadow-xs"
                >
                  إدراج الإدارة المركزية
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. نافذة منبثقة: رفع واستيراد كشف المديريات والإدارات الصحية من إكسيل */}
      
      {/* نافذة تعديل منشأة صحية وتبعيّتها */}
      {facilityToEdit && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-[2px] flex items-center justify-center p-3 sm:p-5 animate-in fade-in"
          onClick={() => setFacilityToEdit(null)}
        >
          <div 
            className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 max-w-lg w-full shadow-2xl relative space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setFacilityToEdit(null)}
              className="absolute left-5 top-5 text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              title="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="p-2 rounded-xl bg-teal-50 text-[#087f78] border border-teal-200">
                <Edit3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#172033]">تعديل بيانات المنشأة الصحية والتبعية</h3>
                <p className="text-xs text-slate-500">تعديل الاسم والتبعية الإدارية (المحافظة والإدارة) واسم المدير</p>
              </div>
            </div>

            <form onSubmit={handleSaveFacilityEdit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">اسم المنشأة الصحية:</label>
                <input
                  type="text"
                  required
                  value={editFacName}
                  onChange={(e) => setEditFacName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-bold focus:outline-none focus:border-[#087f78]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">نوع المنشأة:</label>
                  <select
                    value={editFacType}
                    onChange={(e) => setEditFacType(e.target.value as FacilityType)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium focus:outline-none focus:border-[#087f78]"
                  >
                    <option value="FAMILY_HEALTH_UNIT">وحدة صحة أسرة</option>
                    <option value="FAMILY_HEALTH_CENTER">مركز طب أسرة حضري</option>
                    <option value="MATERNITY_HOSPITAL">مستشفى ولادة ونساء (PPFP)</option>
                    <option value="GENERAL_HOSPITAL">مستشفى عام / مركزي</option>
                    <option value="MOBILE_CLINIC">عيادة متنقلة</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">التبعية - المحافظة:</label>
                  <select
                    value={editFacGovId}
                    onChange={(e) => {
                      const newGovId = e.target.value;
                      setEditFacGovId(newGovId);
                      const targetGov = governorates.find(g => g.id === newGovId);
                      if (targetGov?.districts?.[0]) {
                        setEditFacDistId(targetGov.districts[0].id);
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium focus:outline-none focus:border-[#087f78]"
                  >
                    {governorates.map(gov => (
                      <option key={gov.id} value={gov.id}>محافظة {gov.name_ar}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">التبعية - الإدارة الصحية:</label>
                  <select
                    value={editFacDistId}
                    onChange={(e) => setEditFacDistId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium focus:outline-none focus:border-[#087f78]"
                  >
                    {(governorates.find(g => g.id === editFacGovId)?.districts || []).map(dist => (
                      <option key={dist.id} value={dist.id}>{dist.name_ar}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">اسم مدير المنشأة المسؤول:</label>
                  <input
                    type="text"
                    value={editFacDirector}
                    onChange={(e) => setEditFacDirector(e.target.value)}
                    placeholder="اتركه فارغاً إذا لم يحدد"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium focus:outline-none focus:border-[#087f78]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">حالة المنشأة:</label>
                  <select
                    value={editFacStatus}
                    onChange={(e) => setEditFacStatus(e.target.value as 'ACTIVE' | 'INACTIVE')}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium focus:outline-none focus:border-[#087f78]"
                  >
                    <option value="ACTIVE">نشطة ومفعلة</option>
                    <option value="INACTIVE">معطلة مؤقتاً</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editFacPpfp}
                    onChange={(e) => setEditFacPpfp(e.target.checked)}
                    className="w-4 h-4 rounded text-[#087f78] focus:ring-[#087f78]"
                  />
                  <span className="font-bold text-slate-800">توفر خدمة تركيب اللوالب أثناء الولادة والقيصرية (PPFP)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editFacCounseling}
                    onChange={(e) => setEditFacCounseling(e.target.checked)}
                    className="w-4 h-4 rounded text-[#087f78] focus:ring-[#087f78]"
                  />
                  <span className="font-bold text-slate-800">توفر غرفة مشورة تنظيم الأسرة المتكاملة</span>
                </label>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setFacilityToEdit(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold transition cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#087f78] hover:bg-[#066560] text-white font-bold transition shadow-xs cursor-pointer"
                >
                  حفظ التعديلات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* نافذة تعديل الإدارة الصحية والتبعية للمحافظة */}
      {districtToEdit && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-[2px] flex items-center justify-center p-3 sm:p-5 animate-in fade-in"
          onClick={() => setDistrictToEdit(null)}
        >
          <div 
            className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 max-w-md w-full shadow-2xl relative space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setDistrictToEdit(null)}
              className="absolute left-5 top-5 text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              title="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Building className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#172033]">تعديل بيانات الإدارة الصحية والتبعية</h3>
                <p className="text-xs text-slate-500">تعديل الاسم، التبعية للمحافظة، واسم مدير الإدارة</p>
              </div>
            </div>

            <form onSubmit={handleSaveDistrictEdit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">اسم الإدارة الصحية:</label>
                <input
                  type="text"
                  required
                  value={editDistName}
                  onChange={(e) => setEditDistName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-bold focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">التبعية - المحافظة:</label>
                <select
                  value={editDistGovId}
                  onChange={(e) => setEditDistGovId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium focus:outline-none focus:border-emerald-600"
                >
                  {governorates.map(gov => (
                    <option key={gov.id} value={gov.id}>محافظة {gov.name_ar}</option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  يمكن نقل تبعية هذه الإدارة إلى محافظة أخرى باختيار المحافظة من القائمة
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">كود الإدارة:</label>
                <input
                  type="text"
                  value={editDistCode}
                  onChange={(e) => setEditDistCode(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-mono focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">اسم مدير الإدارة الصحية:</label>
                <input
                  type="text"
                  value={editDistDirector}
                  onChange={(e) => setEditDistDirector(e.target.value)}
                  placeholder="اتركه فارغاً إذا لم يحدد"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDistrictToEdit(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold transition cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition shadow-xs cursor-pointer"
                >
                  حفظ التعديلات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* نافذة تأكيد الحذف للأدمن */}
      {itemToDelete && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-[2px] flex items-center justify-center p-3 sm:p-5 animate-in fade-in"
          onClick={() => setItemToDelete(null)}
        >
          <div 
            className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 max-w-md w-full shadow-2xl relative space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-200">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">تأكيد عملية الحذف</h3>
                <p className="text-xs text-rose-600 font-semibold">إجراء إداري نهائي لا يمكن التراجع عنه</p>
              </div>
            </div>

            <div className="p-3.5 bg-rose-50/60 border border-rose-200 rounded-xl text-xs text-slate-700 leading-relaxed">
              هل أنت متأكد من رغبتك في حذف{' '}
              <strong className="text-rose-700 font-black">
                {itemToDelete.type === 'FACILITY' && 'المنشأة الصحية: '}
                {itemToDelete.type === 'DISTRICT' && 'الإدارة الصحية: '}
                {itemToDelete.type === 'GENERAL_DIRECTORATE' && 'الإدارة العامة: '}
                {itemToDelete.type === 'CENTRAL_ADMIN' && 'الإدارة المركزية: '}
                {itemToDelete.name}
              </strong>
              ؟ سيتم إزالتها فوراً من الهيكل التنظيمي للمنظومة.
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-xs transition cursor-pointer"
              >
                إلغاء التراجع
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>تأكيد الحذف النهائي</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* نافذة تعديل الإدارة المركزية */}
      {caToEdit && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-[2px] flex items-center justify-center p-3 sm:p-5 animate-in fade-in"
          onClick={() => setCaToEdit(null)}
        >
          <div 
            className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 max-w-md w-full shadow-2xl relative space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setCaToEdit(null)}
              className="absolute left-5 top-5 text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              title="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="p-2 rounded-xl bg-teal-50 text-teal-800 border border-teal-200">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#172033]">تعديل بيانات الإدارة المركزية</h3>
                <p className="text-xs text-slate-500">تعديل المسمى الإداري، الكود المؤسسي، واسم رئيس الإدارة المركزية</p>
              </div>
            </div>

            <form onSubmit={handleSaveCentralAdminEdit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">اسم الإدارة المركزية:</label>
                <input
                  type="text"
                  required
                  value={editCaName}
                  onChange={(e) => setEditCaName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-bold focus:outline-none focus:border-[#087f78]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">الكود المؤسسي:</label>
                  <input
                    type="text"
                    value={editCaCode}
                    onChange={(e) => setEditCaCode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-mono font-bold focus:outline-none focus:border-[#087f78]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">القطاع التابع له:</label>
                  <input
                    type="text"
                    value={editCaSector}
                    onChange={(e) => setEditCaSector(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium focus:outline-none focus:border-[#087f78]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">رئيس الإدارة المركزية المكلف:</label>
                <input
                  type="text"
                  value={editCaHead}
                  onChange={(e) => setEditCaHead(e.target.value)}
                  placeholder="اتركه فارغاً إذا لم يحدد"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium focus:outline-none focus:border-[#087f78]"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCaToEdit(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold transition cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#087f78] hover:bg-[#066560] text-white font-bold transition shadow-xs cursor-pointer"
                >
                  حفظ التعديلات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* نافذة تعديل الإدارة العامة */}
      {gdToEdit && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-[2px] flex items-center justify-center p-3 sm:p-5 animate-in fade-in"
          onClick={() => setGdToEdit(null)}
        >
          <div 
            className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 max-w-md w-full shadow-2xl relative space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setGdToEdit(null)}
              className="absolute left-5 top-5 text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              title="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="p-2 rounded-xl bg-slate-100 text-slate-800 border border-slate-200">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#172033]">تعديل بيانات الإدارة العامة</h3>
                <p className="text-xs text-slate-500">تعديل المسمى، التبعية للإدارة المركزية، واسم المدير العام</p>
              </div>
            </div>

            <form onSubmit={handleSaveGeneralDirectorateEdit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">اسم الإدارة العامة:</label>
                <input
                  type="text"
                  required
                  value={editGdName}
                  onChange={(e) => setEditGdName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-bold focus:outline-none focus:border-[#087f78]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">التبعية - الإدارة المركزية:</label>
                <select
                  value={editGdCentralAdminId}
                  onChange={(e) => setEditGdCentralAdminId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium focus:outline-none focus:border-[#087f78]"
                >
                  {centralAdministrations.map(ca => (
                    <option key={ca.id} value={ca.id}>{ca.name_ar}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">كود الإدارة العامة:</label>
                  <input
                    type="text"
                    value={editGdCode}
                    onChange={(e) => setEditGdCode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-mono font-bold focus:outline-none focus:border-[#087f78]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">عدد البرامج الفنية:</label>
                  <input
                    type="number"
                    min="0"
                    value={editGdProgramsCount}
                    onChange={(e) => setEditGdProgramsCount(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-bold focus:outline-none focus:border-[#087f78]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">اسم المدير العام المكلف:</label>
                <input
                  type="text"
                  value={editGdHead}
                  onChange={(e) => setEditGdHead(e.target.value)}
                  placeholder="اتركه فارغاً إذا لم يحدد"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium focus:outline-none focus:border-[#087f78]"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setGdToEdit(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold transition cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#087f78] hover:bg-[#066560] text-white font-bold transition shadow-xs cursor-pointer"
                >
                  حفظ التعديلات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* نافذة تأكيد استعادة الهيكل الافتراضي */}
      {showResetConfirmModal && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-[2px] flex items-center justify-center p-3 sm:p-5 animate-in fade-in"
          onClick={() => setShowResetConfirmModal(false)}
        >
          <div 
            className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 max-w-md w-full shadow-2xl relative space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">استعادة الهيكل التنظيمي المعتمد</h3>
                <p className="text-xs text-amber-600 font-semibold">استعادة الإدارات المركزية والعامة والمديريات الافتراضية</p>
              </div>
            </div>

            <div className="p-3.5 bg-amber-50/60 border border-amber-200 rounded-xl text-xs text-slate-700 leading-relaxed">
              هل أنت متأكد من رغبتك في استعادة الهيكل التنظيمي الأصلي؟ سيتم استرجاع الإدارات المركزية والإدارات العامة والمديريات والمنشآت المعتمدة رسمياً، مع مسح التعديلات المحلية غير المحفوظة في قاعدة البيانات.
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowResetConfirmModal(false)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-xs transition cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleResetHierarchyToDefault}
                className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>تأكيد استعادة الافتراضي</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <BulkDistrictsUploaderModal
        isOpen={showBulkUploadModal}
        onClose={() => setShowBulkUploadModal(false)}
        onDistrictsImported={handleDistrictsImported}
      />

      <OperationFeedbackDialog
        open={Boolean(operationFeedback)}
        type={operationFeedback?.type || 'success'}
        title={operationFeedback?.title || 'تمت العملية'}
        message={operationFeedback?.message || ''}
        onClose={() => setOperationFeedback(null)}
      />

    </div>
  );
};
