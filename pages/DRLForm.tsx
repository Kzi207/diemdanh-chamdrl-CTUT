import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getStudents, getDRLScores, saveDRLScore, getCurrentUser, uploadProofImage, getGradingPeriods, deleteProofImage } from '../services/storage';
import { Student, DRLScore, User, GradingPeriod } from '../types';
import { Save, ArrowLeft, CheckCircle, Upload, Image as ImageIcon, Trash2, ExternalLink, Loader2, Eye, X, AlertTriangle, Cloud, CloudOff, RefreshCw, Lock, Home, Repeat, Undo2, Calendar, FileText, Download } from 'lucide-react';
import jsPDF from 'jspdf';

// Dữ liệu tiêu chí từ PDF (GIỮ NGUYÊN)
const CRITERIA = [
    // === PHẦN I: Ý THỨC HỌC TẬP (MAX 20) ===
    { id: 'I', content: 'I. Đánh giá về ý thức tham gia học tập', max: 20 },
    { id: 'I.1', content: '1. Kết quả học tập (TB: 2đ, Khá: 3đ, Giỏi: 4đ, Xuất sắc: 5đ)', max: 5, parent: 'I' },
    { id: 'I.2', content: '2. Có giấy chứng nhận tham gia lớp kỹ năng học tập', max: 3, parent: 'I' },
    { id: 'I.3', content: '3. Tham gia Hội thảo / Tọa đàm (3đ/lần)', max: 10, parent: 'I' },
    { id: 'I.4', content: '4. Thi học thuật cấp Khoa/Trường (Tham gia: 3đ, Giải: 4-7đ)', max: 7, parent: 'I' },
    { id: 'I.5', content: '5. Thi học thuật cấp Ngoài trường (Tham gia: 4đ, Giải: 5-8đ)', max: 8, parent: 'I' },
    { id: 'I.6', content: '6. Báo cáo khoa học cấp Khoa (Đạt: 3-8đ)', max: 8, parent: 'I' },
    { id: 'I.7', content: '7. NCKH cấp Trường (Đạt: 5-10đ)', max: 10, parent: 'I' },
    { id: 'I.8', content: '8. Viết bài báo khoa học (5-8đ)', max: 8, parent: 'I' },
    { id: 'I.9', content: '9. Thi khởi nghiệp cấp Trường (Tham gia: 3đ, Giải: 4-7đ)', max: 7, parent: 'I' },
    { id: 'I.10', content: '10. Thi khởi nghiệp Ngoài trường (Tham gia: 4đ, Giải: 5-8đ)', max: 8, parent: 'I' },
    { id: 'I.11', content: '11. Thành viên CLB học thuật (2đ/HK)', max: 2, parent: 'I' },
    { id: 'I.12', content: '12. Các hoạt động học thuật khác', max: 5, parent: 'I' },

    // === PHẦN II: Ý THỨC NỘI QUY (MAX 25) ===
    { id: 'II', content: 'II. Đánh giá về ý thức chấp hành nội quy, quy chế', max: 25 },
    { id: 'II.1', content: '1. Ý thức, thái độ trong học tập (Đi học đầy đủ, đúng giờ)', max: 5, parent: 'II' },
    { id: 'II.2', content: '2. Chấp hành tốt nội quy, quy chế Nhà trường', max: 5, parent: 'II' },
    { id: 'II.3', content: '3. Thực hiện tốt quy chế thi, kiểm tra', max: 5, parent: 'II' },
    { id: 'II.4', content: '4. Chấp hành quy định thư viện', max: 5, parent: 'II' },
    { id: 'II.5', content: '5. Bảo vệ tài sản, phòng học', max: 5, parent: 'II' },
    { id: 'II.6', content: '6. Thực hiện đăng ký ngoại trú', max: 5, parent: 'II' },
    { id: 'II.7', content: '7. Mặc đồng phục đúng quy định', max: 5, parent: 'II' },
    { id: 'II.8', content: '8. Tham gia sinh hoạt lớp với CVHT', max: 5, parent: 'II' },

    // === PHẦN III: HOẠT ĐỘNG CHÍNH TRỊ - XÃ HỘI (MAX 20) ===
    { id: 'III', content: 'III. Đánh giá về ý thức tham gia hoạt động CT-XH, VH-VN-TT', max: 20 },
    { id: 'III.1', content: '1. Hoạt động bắt buộc do Khoa/Trường tổ chức (3đ/lần)', max: 10, parent: 'III' },
    { id: 'III.2', content: '2. Đại hội Chi đoàn/Chi hội, sinh hoạt Chi đoàn (3đ/lần)', max: 10, parent: 'III' },
    { id: 'III.3', content: '3. Báo cáo chuyên đề chính trị trực tiếp/trực tuyến', max: 10, parent: 'III' },
    { id: 'III.4', content: '4. Hoạt động ngoại khóa Khoa/Trường/CLB (1-7đ)', max: 7, parent: 'III' },
    { id: 'III.5', content: '5. Hoạt động ngoại khóa cấp Thành phố trở lên (1-8đ)', max: 8, parent: 'III' },
    { id: 'III.6', content: '6. Được kết nạp Đoàn', max: 5, parent: 'III' },
    { id: 'III.7', content: '7. Được kết nạp Đảng', max: 8, parent: 'III' },
    { id: 'III.8', content: '8. Hoạt động điều động của Đoàn/Hội (2-4đ)', max: 10, parent: 'III' },
    { id: 'III.9', content: '9. Thành viên các CLB/Đội/Nhóm (2đ/HK)', max: 2, parent: 'III' },
    { id: 'III.10', content: '10. Học tập các bài lý luận chính trị (4đ/lần)', max: 4, parent: 'III' },
    { id: 'III.11', content: '11. Hoạt động đền ơn đáp nghĩa, thắp nến tri ân (3đ/lần)', max: 10, parent: 'III' },
    { id: 'III.12', content: '12. Lao động tình nguyện tại Trường (3đ/lần)', max: 10, parent: 'III' },
    { id: 'III.13', content: '13. Khen thưởng trong phong trào (5-7đ)', max: 7, parent: 'III' },
    { id: 'III.14', content: '14. Tập thể được khen thưởng (1đ/lần)', max: 2, parent: 'III' },
    { id: 'III.15', content: '15. Các hoạt động khác (1-3đ)', max: 5, parent: 'III' },

    // === PHẦN IV: CÔNG DÂN & CỘNG ĐỒNG (MAX 25) ===
    { id: 'IV', content: 'IV. Đánh giá về ý thức công dân trong quan hệ cộng đồng', max: 25 },
    { id: 'IV.1', content: '1. Chấp hành luật pháp, tuyên truyền pháp luật (10đ)', max: 10, parent: 'IV' },
    { id: 'IV.2', content: '2. Tương thân tương ái, giúp đỡ người khó khăn (5đ)', max: 5, parent: 'IV' },
    { id: 'IV.3', content: '3. Được biểu dương người tốt việc tốt (5đ)', max: 5, parent: 'IV' },
    { id: 'IV.4', content: '4. Giao lưu các CLB/Đội/Nhóm (3-5đ)', max: 5, parent: 'IV' },
    { id: 'IV.5', content: '5. Chương trình Tư vấn tuyển sinh (5đ)', max: 5, parent: 'IV' },
    { id: 'IV.6', content: '6. Công tác nhập học (5đ)', max: 5, parent: 'IV' },
    { id: 'IV.7', content: '7. Công tác khám sức khỏe đầu khóa (5đ)', max: 5, parent: 'IV' },
    { id: 'IV.8', content: '8. Công tác Ngày hội việc làm (5đ)', max: 5, parent: 'IV' },
    { id: 'IV.9', content: '9. Công tác Lễ tốt nghiệp (5đ)', max: 5, parent: 'IV' },
    { id: 'IV.10', content: '10. Công tác kiểm tra hồ sơ (5đ)', max: 5, parent: 'IV' },
    { id: 'IV.11', content: '11. Phiên giao dịch việc làm (1-3đ)', max: 5, parent: 'IV' },
    { id: 'IV.12', content: '12. Hiến máu tình nguyện (10đ/lần)', max: 10, parent: 'IV' },
    { id: 'IV.13', content: '13. Xuân tình nguyện (4-5đ)', max: 5, parent: 'IV' },
    { id: 'IV.14', content: '14. Mùa hè xanh (5-7đ)', max: 7, parent: 'IV' },
    { id: 'IV.15', content: '15. Ngày Chủ nhật xanh (3-5đ)', max: 5, parent: 'IV' },
    { id: 'IV.16', content: '16. Thứ Bảy tình nguyện (3-5đ)', max: 5, parent: 'IV' },
    { id: 'IV.17', content: '17. Chào đón tân sinh viên (3-5đ)', max: 5, parent: 'IV' },
    { id: 'IV.18', content: '18. Hoạt động PTBV, Trách nhiệm xã hội (1-3đ)', max: 5, parent: 'IV' },

    // === PHẦN V: CÁN BỘ LỚP & THÀNH TÍCH ĐẶC BIỆT (MAX 10) ===
    { id: 'V', content: 'V. Tham gia công tác cán bộ lớp, thành tích đặc biệt', max: 10 },
    { id: 'V.1', content: '1. Tham gia tích cực phong trào Lớp/Đoàn/Hội (3đ)', max: 3, parent: 'V' },
    { id: 'V.2', content: '2. Cán bộ Lớp/Đoàn/Hội hoàn thành nhiệm vụ (3-5đ)', max: 5, parent: 'V' },
    { id: 'V.3', content: '3. Đạt giải về học tập, NCKH (3-6đ)', max: 6, parent: 'V' },
    { id: 'V.4', content: '4. Bằng khen UBND Tỉnh/Thành phố (5đ)', max: 5, parent: 'V' },
    { id: 'V.5', content: '5. Sinh viên 5 tốt cấp Trường/Đoàn viên tiêu biểu (6đ)', max: 6, parent: 'V' },
    { id: 'V.6', content: '6. Sinh viên 5 tốt cấp Thành/Trung ương (10đ)', max: 10, parent: 'V' },
    { id: 'V.7', content: '7. Đạt danh hiệu Đoàn viên ưu tú (6đ)', max: 6, parent: 'V' },
    { id: 'V.8', content: '8. Giấy khen tập thể của Đoàn (2đ)', max: 2, parent: 'V' },
];

const DRLForm: React.FC = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = getCurrentUser();
  
  const [student, setStudent] = useState<Student | null>(null);
  const [scoreData, setScoreData] = useState<DRLScore | null>(null);
  const [currentPeriodId, setCurrentPeriodId] = useState<string>('');
  const [periods, setPeriods] = useState<GradingPeriod[]>([]);
  
  // Form State: { criteriaId: score }
  const [selfScores, setSelfScores] = useState<Record<string, number>>({});
  const [classScores, setClassScores] = useState<Record<string, number>>({});
  const [bchScores, setBchScores] = useState<Record<string, number>>({});
  const [facultyScores, setFacultyScores] = useState<Record<string, number>>({});
  
  // Proofs State: { criteriaId: url }
  const [proofs, setProofs] = useState<Record<string, string>>({});
  
  // Upload handling
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const targetCriteriaRef = useRef<string>("");
  
  // Image Preview
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  // Auto-Save State
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const isFirstRun = useRef(true);

  // Lock State
  const [isLocked, setIsLocked] = useState(false);
  const [lockReason, setLockReason] = useState('');
  
  // Export State
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    // Determine Period ID
    const init = async () => {
        const params = new URLSearchParams(location.search);
        let pid = params.get('period');
        
        const periodsList = await getGradingPeriods();
        setPeriods(periodsList);

        let targetPeriod = null;

        if (!pid) {
            // Default to active/latest period if not in URL
            if (periodsList.length > 0) {
                targetPeriod = periodsList[periodsList.length - 1];
                pid = targetPeriod.id;
            } else {
                pid = 'HK1_2024';
            }
        } else {
            targetPeriod = periodsList.find(p => p.id === pid);
        }

        // === Check Date Lock ===
        if (targetPeriod && currentUser?.role === 'student') {
             const now = new Date();
             const start = targetPeriod.startDate ? new Date(targetPeriod.startDate) : null;
             const end = targetPeriod.endDate ? new Date(targetPeriod.endDate) : null;
             
             // Set end date to end of day
             if (end) end.setHours(23, 59, 59, 999);

             if (start && now < start) {
                 setIsLocked(true);
                 setLockReason(`Đợt chấm chưa mở. Bắt đầu từ: ${start.toLocaleDateString('vi-VN')}`);
             } else if (end && now > end) {
                 setIsLocked(true);
                 setLockReason(`Đợt chấm đã kết thúc vào: ${end.toLocaleDateString('vi-VN')}`);
             } else {
                 // Reset lock if period is valid
                 setIsLocked(false);
                 setLockReason('');
             }
        }

        setCurrentPeriodId(pid);
        if (studentId) loadData(studentId, pid);
    }
    init();
  }, [studentId, location.search]);

  // Reset image error when opening new image
  useEffect(() => {
      setImageError(false);
  }, [previewImage]);

  // === AUTO SAVE LOGIC ===
  useEffect(() => {
      // Skip auto-save on initial load OR if locked
      if (isFirstRun.current || isLocked) {
          isFirstRun.current = false;
          return;
      }

      if (!student) return;

      setAutoSaveStatus('saving');
      
      const timer = setTimeout(async () => {
          try {
              // Auto-save keeps the current status (or defaults to draft)
              // We don't want to accidentally submit/approve just by typing
              await saveToDatabase(scoreData?.status || 'draft');
              setAutoSaveStatus('saved');
          } catch (e) {
              console.error("Auto-save failed", e);
              setAutoSaveStatus('error');
          }
      }, 1500); // 1.5s Debounce

      return () => clearTimeout(timer);
  }, [selfScores, classScores, bchScores, facultyScores, proofs]);


  const loadData = async (id: string, periodId: string) => {
    const students = await getStudents(); 
    const s = students.find(st => st.id === id);
    if (s) setStudent(s);

    const scores = await getDRLScores();
    const existing = scores.find(sc => sc.studentId === id && sc.semester === periodId);
    
    if (existing) {
        setScoreData(existing);
        if (existing.details) {
            setSelfScores(existing.details.self || {});
            setClassScores(existing.details.class || {});
            setBchScores(existing.details.bch || {});
            setFacultyScores(existing.details.faculty || {});
            setProofs(existing.details.proofs || {});
        }
    } else {
        // MỚI: Khởi tạo tất cả là 0 (Không mặc định 5 điểm mục II nữa)
        setSelfScores({});
        // Reset others
        setClassScores({});
        setBchScores({});
        setFacultyScores({});
        setProofs({});
        setScoreData(null); // Clear score data if new
    }
    // Prevent auto-save from triggering immediately after load
    setTimeout(() => { isFirstRun.current = false; }, 500);
  };

  // Calculates the FINAL total score (Clamped to section limits)
  const calculateTotal = (scoresObj: Record<string, number>) => {
      let finalTotal = 0;
      
      // Get main groups (I, II, III, IV, V)
      const groups = CRITERIA.filter(c => !c.parent);

      groups.forEach(group => {
          let groupSum = 0;
          const children = CRITERIA.filter(c => c.parent === group.id);
          
          children.forEach(child => {
              groupSum += (scoresObj[child.id] || 0);
          });
          
          // Clamp group sum to group max for Final Score calculation
          finalTotal += Math.min(groupSum, group.max);
      });

      return Math.min(100, Math.max(0, finalTotal));
  };

  // Calculates the RAW group total for display (Not clamped)
  const getGroupTotal = (scoresObj: Record<string, number>, groupId: string) => {
      let groupSum = 0;
      const group = CRITERIA.find(c => c.id === groupId);
      if(!group) return 0;

      const children = CRITERIA.filter(c => c.parent === groupId);
      children.forEach(child => {
          groupSum += (scoresObj[child.id] || 0);
      });
      
      // Return raw sum to show user exactly what they entered
      return groupSum;
  };

  // Helper to save data (internal)
  const saveToDatabase = async (status: string, proofsOverride?: Record<string, string>) => {
      if (!student || !currentUser || !currentPeriodId || isLocked) return;

      const currentTotalSelf = calculateTotal(selfScores);
      const currentTotalClass = calculateTotal(classScores);
      const currentTotalBch = calculateTotal(bchScores);
      const currentTotalFac = calculateTotal(facultyScores);

      // MỚI: Tắt tính năng tự động kế thừa (Inheritance).
      // Chỉ lưu đúng điểm của từng cấp. Nếu chưa chấm -> để trống/0.
      const finalDetails = {
          self: selfScores,
          class: classScores, // Không fallback về selfScores
          bch: bchScores,     // Không fallback
          faculty: facultyScores, // Không fallback
          proofs: proofsOverride || proofs
      };

      // Xác định Final Score dựa trên cấp cao nhất đã chấm
      // Ưu tiên: Khoa -> BCH -> Lớp -> SV
      let bestFinalScore = 0;
      if (currentTotalFac > 0 || Object.keys(facultyScores).length > 0) bestFinalScore = currentTotalFac;
      else if (currentTotalBch > 0 || Object.keys(bchScores).length > 0) bestFinalScore = currentTotalBch;
      else if (currentTotalClass > 0 || Object.keys(classScores).length > 0) bestFinalScore = currentTotalClass;
      else bestFinalScore = currentTotalSelf;

      const payload: DRLScore = {
          id: scoreData?.id || `${student.id}_${currentPeriodId}`,
          studentId: student.id,
          semester: currentPeriodId,
          selfScore: currentTotalSelf,
          classScore: currentTotalClass,
          bchScore: currentTotalBch,
          facultyScore: currentTotalFac,
          finalScore: bestFinalScore,
          details: finalDetails,
          status: status as any
      };

      await saveDRLScore(payload);
      setScoreData(payload); // Update local state with latest data/id
      return payload; 
  };

  const handleSave = async (isSubmit: boolean = false) => {
      if (isLocked) return;
      
      let newStatus = scoreData?.status || 'draft';
      
      // State machine logic based on role
      if (currentUser?.role === 'student' && isSubmit) newStatus = 'submitted';
      if (currentUser?.role === 'monitor' && isSubmit) newStatus = 'class_approved';
      if (currentUser?.role === 'bch' && isSubmit) newStatus = 'bch_approved';
      if (currentUser?.role === 'doankhoa' && isSubmit) newStatus = 'finalized';

      await saveToDatabase(newStatus);
      
      if (isSubmit) {
        alert("Đã lưu và gửi thành công!");
        if (currentUser?.role === 'student') {
            navigate('/');
        } else {
            navigate('/drl');
        }
      } else {
        // Just explicit save draft
        setAutoSaveStatus('saved');
      }
  };

  const handleUnsubmit = async () => {
    if (isLocked) { alert("Đã hết hạn chỉnh sửa."); return; }
    if (!window.confirm("Bạn có chắc muốn HỦY NỘP để chỉnh sửa lại?\n\nLưu ý: Nếu Lớp trưởng đã chấm, bạn sẽ cần liên hệ để yêu cầu chấm lại.")) return;

    try {
        await saveToDatabase('draft');
        alert("Đã hủy nộp. Bạn có thể chỉnh sửa ngay bây giờ.");
    } catch (e) {
        alert("Lỗi: " + (e as Error).message);
    }
  };

  const canEdit = (column: 'self' | 'class' | 'bch' | 'faculty') => {
      if (!currentUser) return false;
      if (isLocked && currentUser.role === 'student') return false; 

      if (currentUser.role === 'admin') return true;

      // STUDENT logic
      if (currentUser.role === 'student') {
          // Chỉ được sửa cột Self
          if (column !== 'self') return false;
          // Nếu chưa có dữ liệu (null) hoặc đang ở trạng thái nháp -> Được sửa
          if (!scoreData || scoreData.status === 'draft') return true;
          // Nếu đã nộp (submitted), đã duyệt, v.v... -> Không được sửa (Phải Hủy nộp mới sửa được)
          return false; 
      }
      
      if (column === 'class' && currentUser.role === 'monitor') {
           // Được chấm khi SV đã nộp hoặc Lớp đã duyệt (để sửa lại)
           // Không được sửa nếu BCH đã duyệt
           if (!scoreData) return true; // Cho phép nếu data mới
           if (scoreData.status === 'submitted' || scoreData.status === 'class_approved') return true;
           return false;
      }

      if (column === 'bch' && currentUser.role === 'bch') return true;
      if (column === 'faculty' && currentUser.role === 'doankhoa') return true;
      return false;
  };

  const handleUploadClick = (criteriaId: string) => {
      if (isLocked) { alert("Đã hết hạn nộp minh chứng."); return; }
      targetCriteriaRef.current = criteriaId;
      fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      const criteriaId = targetCriteriaRef.current;
      
      if (!file || !criteriaId || !student) return;

      if (file.size > 5 * 1024 * 1024) {
          alert("Vui lòng chọn ảnh nhỏ hơn 5MB.");
          return;
      }

      setUploadingId(criteriaId);
      try {
          const url = await uploadProofImage(file, student.id, criteriaId);
          // Just update state, useEffect will handle auto-save
          setProofs(prev => ({ ...prev, [criteriaId]: url }));
      } catch (error) {
          alert("Lỗi upload ảnh: " + (error as Error).message);
      } finally {
          setUploadingId(null);
          if (fileInputRef.current) fileInputRef.current.value = '';
      }
  };

  const handleRemoveProof = async (criteriaId: string) => {
      if (isLocked) return;
      if(window.confirm("Bạn muốn xóa minh chứng này? Ảnh sẽ bị xóa vĩnh viễn khỏi hệ thống.")) {
          // 1. Update State Local
          const newProofs = { ...proofs };
          delete newProofs[criteriaId];
          setProofs(newProofs); // Effect will trigger auto-save for DB update

          // 2. Call Server Delete (physically remove file)
          if (student) {
              await deleteProofImage(student.id, criteriaId).catch(console.error);
          }
      }
  };

  const handleInputChange = (c: any, valueStr: string, state: any, setState: any) => {
      if (valueStr === '') {
          setState({ ...state, [c.id]: 0 });
          return;
      }

      let val = Number(valueStr);
      
      // Validation Logic
      if (val > c.max) {
          alert(`Điểm không hợp lệ! Mục này tối đa là ${c.max} điểm.`);
          val = c.max; // Auto correct to max
      }
      if (val < 0) val = 0;

      setState({ ...state, [c.id]: val });
  };

  const handleExportPDF = async () => {
    if (!student) return;
    setIsExporting(true);
    try {
        const doc = new jsPDF();
        const fontUrl = 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Regular.ttf';
        const fontResponse = await fetch(fontUrl);
        const fontBuffer = await fontResponse.arrayBuffer();
        let binary = '';
        const bytes = new Uint8Array(fontBuffer);
        for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
        const base64Font = btoa(binary);

        doc.addFileToVFS('Roboto-Regular.ttf', base64Font);
        doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
        doc.setFont('Roboto');

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        let yPos = 20;

        // Title
        doc.setFontSize(14);
        doc.text('PHIẾU ĐÁNH GIÁ ĐIỂM RÈN LUYỆN', pageWidth/2, yPos, { align: 'center' });
        yPos += 10;

        // Info
        doc.setFontSize(11);
        doc.text(`Họ tên: ${student.lastName} ${student.firstName}`, 15, yPos);
        doc.text(`MSSV: ${student.id}`, 140, yPos);
        yPos += 7;
        doc.text(`Đợt: ${currentPeriodId}`, 15, yPos);
        doc.text(`Trạng thái: ${scoreData?.status || 'Nháp'}`, 140, yPos);
        yPos += 10;

        // Table Config
        const cols = [
            { header: 'Nội dung', w: 100 },
            { header: 'Max', w: 15 },
            { header: 'Tự chấm', w: 20 },
            { header: 'Lớp', w: 20 },
            { header: 'BCH', w: 20 },
        ];
        // Only show Faculty col if DoanKhoa/Admin/Finalized
        if (showFaculty) cols.push({ header: 'Khoa', w: 15 });

        let startX = 15;
        
        // Draw Header
        doc.setFillColor(230, 230, 230);
        doc.setFontSize(10);
        
        let currentX = startX;
        doc.rect(startX, yPos, 190, 8, 'F');
        cols.forEach(c => {
            doc.text(c.header, currentX + 2, yPos + 6);
            currentX += c.w;
        });
        yPos += 8;

        // Content
        CRITERIA.forEach(c => {
            // Check page break
            if (yPos > pageHeight - 20) {
                doc.addPage();
                yPos = 20;
            }

            const isGroup = !c.parent;
            const rowHeight = isGroup ? 8 : 12; // Wrap text if long
            
            // Draw background for groups
            if (isGroup) {
                doc.setFillColor(245, 245, 255);
                doc.rect(startX, yPos, 190, rowHeight, 'F');
                doc.text(c.content, startX + 2, yPos + 6);
                
                // Group max
                doc.text(String(c.max), startX + 100 + 2, yPos + 6);

                // Group Totals
                let x = startX + 115;
                doc.text(String(getGroupTotal(selfScores, c.id)), x + 5, yPos + 6);
                x += 20;
                doc.text(String(showClass ? getGroupTotal(classScores, c.id) : 0), x + 5, yPos + 6);
                x += 20;
                doc.text(String(showBCH ? getGroupTotal(bchScores, c.id) : 0), x + 5, yPos + 6);
                if(showFaculty) {
                    x += 20;
                    doc.text(String(getGroupTotal(facultyScores, c.id)), x + 5, yPos + 6);
                }

                yPos += rowHeight;
            } else {
                // Item Row - Text Wrapping
                const splitText = doc.splitTextToSize(c.content, 95);
                const dynamicHeight = Math.max(8, splitText.length * 5 + 4);

                if (yPos + dynamicHeight > pageHeight - 10) {
                    doc.addPage();
                    yPos = 20;
                }

                doc.text(splitText, startX + 2, yPos + 5);
                doc.text(String(c.max), startX + 100 + 2, yPos + 5);

                // Scores
                let x = startX + 115;
                const selfVal = selfScores[c.id] || 0;
                doc.text(String(selfVal), x + 5, yPos + 5);
                x += 20;
                const classVal = classScores[c.id] || 0;
                doc.text(String(showClass ? classVal : 0), x + 5, yPos + 5);
                x += 20;
                const bchVal = bchScores[c.id] || 0;
                doc.text(String(showBCH ? bchVal : 0), x + 5, yPos + 5);
                if (showFaculty) {
                    x += 20;
                    const facVal = facultyScores[c.id] || 0;
                    doc.text(String(facVal), x + 5, yPos + 5);
                }

                // Divider Line
                doc.setDrawColor(220, 220, 220);
                doc.line(startX, yPos + dynamicHeight, startX + 190, yPos + dynamicHeight);
                yPos += dynamicHeight;
            }
        });

        // Final Total
        if (yPos > pageHeight - 30) { doc.addPage(); yPos = 20; }
        yPos += 5;
        doc.setFillColor(255, 240, 200);
        doc.rect(startX, yPos, 190, 10, 'F');
        doc.setFontSize(12);
        doc.text("TỔNG ĐIỂM", startX + 60, yPos + 7);
        doc.text("100", startX + 100 + 2, yPos + 7);
        
        let x = startX + 115;
        doc.text(String(calculateTotal(selfScores)), x + 5, yPos + 7);
        x += 20;
        doc.text(String(showClass ? calculateTotal(classScores) : 0), x + 5, yPos + 7);
        x += 20;
        doc.text(String(showBCH ? calculateTotal(bchScores) : 0), x + 5, yPos + 7);
        if(showFaculty) {
            x += 20;
            doc.text(String(calculateTotal(facultyScores)), x + 5, yPos + 7);
        }

        doc.save(`DRL_${student.id}_${currentPeriodId}.pdf`);

    } catch (e) {
        alert("Lỗi xuất PDF: " + (e as Error).message);
    } finally {
        setIsExporting(false);
    }
  };

  const renderInput = (c: any, type: 'self' | 'class' | 'bch' | 'faculty', state: any, setState: any) => {
      const editable = canEdit(type);
      
      // LOGIC MỚI: Ẩn điểm nếu chưa đến cấp duyệt tương ứng (trừ khi là người có quyền chấm cấp đó)
      let isVisible = true;

      // Cột BCH: Hiện khi là Admin/BCH/DoanKhoa HOẶC đã duyệt qua BCH
      if (type === 'bch') {
           const isRoleAllowed = ['admin', 'bch', 'doankhoa'].includes(currentUser?.role || '');
           const isStatusReached = ['bch_approved', 'finalized'].includes(scoreData?.status || '');
           isVisible = isRoleAllowed || isStatusReached;
      }
      // Cột Đoàn Khoa: Hiện khi là Admin/DoanKhoa HOẶC đã Finalized
      if (type === 'faculty') {
           const isRoleAllowed = ['admin', 'doankhoa'].includes(currentUser?.role || '');
           const isStatusReached = scoreData?.status === 'finalized';
           isVisible = isRoleAllowed || isStatusReached;
      }
      // Cột Lớp: Hiện khi là Admin/Monitor/BCH/DoanKhoa HOẶC đã duyệt qua Lớp
      if (type === 'class') {
           const isRoleAllowed = ['admin', 'monitor', 'bch', 'doankhoa'].includes(currentUser?.role || '');
           const isStatusReached = ['class_approved', 'bch_approved', 'finalized'].includes(scoreData?.status || '');
           isVisible = isRoleAllowed || isStatusReached;
      }

      // Default to 0 if value is undefined/missing
      const val = isVisible ? (state[c.id] !== undefined ? state[c.id] : 0) : 0;
      const isDisabled = !editable || !isVisible;

      return (
          <input 
            type="number" 
            min="0" 
            max={c.max} 
            value={val === 0 ? "0" : val.toString()}
            onChange={(e) => handleInputChange(c, e.target.value, state, setState)}
            disabled={isDisabled}
            onFocus={(e) => e.target.select()} // Auto select content on click
            className={`w-full text-center border rounded px-0 py-1 h-7 text-xs ${!isDisabled ? 'bg-white border-blue-300 focus:ring-1 focus:ring-blue-500' : 'bg-gray-100 border-transparent text-gray-500 cursor-not-allowed'}`}
          />
      );
  };

  const renderProofCell = (c: any) => {
    if (!c.parent) return null;
    const proofUrl = proofs[c.id];
    const isUploading = uploadingId === c.id;
    
    // Quyền upload/xóa: Chỉ Sinh viên chủ sở hữu (và phải được phép edit cột self)
    const isStudentOwner = currentUser?.role === 'student';
    const canModifyProof = isStudentOwner && canEdit('self');
    
    // Extract filename for better UI
    let fileName = 'File';
    if (proofUrl) {
        try {
            const parts = proofUrl.split('/');
            const rawName = parts[parts.length - 1];
            // Remove timestamp prefix if it exists (e.g. 173..._name.jpg)
            const underscoreIndex = rawName.indexOf('_');
            fileName = underscoreIndex > -1 ? rawName.substring(underscoreIndex + 1) : rawName;
            
            // Truncate if too long
            if (fileName.length > 10) fileName = fileName.substring(0, 8) + '...';
        } catch { }
    }

    return (
        <div className="flex items-center justify-center gap-1">
            {isUploading ? (
                <Loader2 size={14} className="animate-spin text-blue-500" />
            ) : proofUrl ? (
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setPreviewImage(proofUrl);
                        }}
                        className="flex items-center gap-1 text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-1 rounded hover:bg-blue-100 transition-colors whitespace-nowrap"
                        title="Nhấn để xem minh chứng"
                    >
                        <Eye size={12}/> {fileName}
                    </button>
                    {/* Chỉ hiện nút xóa nếu là Sinh viên chủ sở hữu */}
                    {canModifyProof && (
                        <button 
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                handleRemoveProof(c.id);
                            }} 
                            className="text-red-400 hover:text-red-600 p-1"
                            title="Xóa minh chứng"
                        >
                            <Trash2 size={12}/>
                        </button>
                    )}
                </div>
            ) : (
                canModifyProof ? (
                    <button 
                        onClick={() => handleUploadClick(c.id)}
                        className="text-gray-300 hover:text-blue-600 transition-colors"
                        title="Tải ảnh minh chứng"
                    >
                        <Upload size={14}/>
                    </button>
                ) : (
                    <span className="text-gray-300 text-[10px] italic">--</span>
                )
            )}
        </div>
    );
  };

  const handleBack = () => {
    if (currentUser?.role === 'student') {
        navigate('/');
    } else {
        navigate('/drl');
    }
  };

  if (!student) return <div>Loading...</div>;

  // VISIBILITY CHECKS FOR TOTALS
  const showBCH = ['admin', 'bch', 'doankhoa'].includes(currentUser?.role || '') || ['bch_approved', 'finalized'].includes(scoreData?.status || '');
  const showFaculty = ['admin', 'doankhoa'].includes(currentUser?.role || '') || scoreData?.status === 'finalized';
  const showClass = ['admin', 'monitor', 'bch', 'doankhoa'].includes(currentUser?.role || '') || ['class_approved', 'bch_approved', 'finalized'].includes(scoreData?.status || '');

  return (
    <div className="p-4 max-w-full">
       <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />

       {/* Image Preview Modal */}
       {previewImage && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4" onClick={() => setPreviewImage(null)}>
           <div className="relative max-w-4xl w-full max-h-full bg-white rounded-lg overflow-hidden shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
             <div className="flex justify-between items-center p-3 border-b bg-gray-50">
                <span className="font-bold text-gray-700">Xem minh chứng</span>
                <div className="flex items-center gap-3">
                    <a href={previewImage} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm hover:underline flex items-center gap-1">
                        <ExternalLink size={14}/> Mở tab mới
                    </a>
                    <button
                    onClick={() => setPreviewImage(null)}
                    className="p-1 hover:bg-gray-200 rounded-full text-gray-500"
                    >
                    <X size={20} />
                    </button>
                </div>
             </div>
             <div className="flex-1 p-4 bg-gray-100 flex items-center justify-center overflow-auto min-h-[300px]">
                {imageError ? (
                    <div className="text-center">
                        <div className="bg-red-50 p-4 rounded-full inline-block mb-3">
                            <AlertTriangle className="text-red-500" size={32}/>
                        </div>
                        <p className="text-red-600 font-bold">Không thể hiển thị ảnh này.</p>
                        <p className="text-gray-500 text-sm mb-4">Có thể do định dạng file hoặc lỗi kết nối.</p>
                        <a href={previewImage} target="_blank" rel="noopener noreferrer" className="bg-blue-600 text-white px-4 py-2 rounded font-bold inline-flex items-center gap-2 hover:bg-blue-700">
                            <ExternalLink size={16}/> Thử mở trong tab mới
                        </a>
                    </div>
                ) : (
                    <img 
                        src={previewImage} 
                        alt="Proof" 
                        className="max-w-full max-h-[80vh] object-contain shadow-sm"
                        referrerPolicy="no-referrer"
                        onError={() => setImageError(true)} 
                    />
                )}
             </div>
           </div>
         </div>
       )}
        
       {/* LOCKED WARNING */}
       {isLocked && (
           <div className="mb-4 bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r shadow-sm flex items-start gap-3">
               <Lock className="text-orange-500 shrink-0 mt-0.5" size={24} />
               <div>
                   <h3 className="text-orange-800 font-bold text-lg">Đã khóa chỉnh sửa</h3>
                   <p className="text-orange-700">{lockReason}</p>
                   <p className="text-sm text-orange-600 mt-1">Bạn chỉ có thể xem điểm và minh chứng.</p>
               </div>
           </div>
       )}

       {/* SUBMITTED WARNING */}
       {!isLocked && scoreData?.status === 'submitted' && currentUser?.role === 'student' && (
           <div className="mb-4 bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r shadow-sm flex items-start gap-3">
               <CheckCircle className="text-blue-500 shrink-0 mt-0.5" size={24} />
               <div>
                   <h3 className="text-blue-800 font-bold text-lg">Đã nộp phiếu chấm</h3>
                   <p className="text-blue-700 text-sm">Bạn đã gửi phiếu chấm này. Để chỉnh sửa điểm hoặc upload lại minh chứng, vui lòng nhấn nút <b>"Hủy nộp"</b> bên dưới.</p>
               </div>
           </div>
       )}

       <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-4 justify-between">
           <div className="flex items-center gap-4 w-full md:w-auto">
               {currentUser?.role !== 'student' && (
                   <button onClick={handleBack} className="p-2 hover:bg-gray-200 rounded-full shrink-0"><ArrowLeft size={20}/></button>
               )}
               
               <div className="flex-1">
                   <h1 className="text-xl font-bold truncate">Chấm ĐRL: {student.lastName} {student.firstName}</h1>
                   <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500 mt-1">
                       <span className="font-mono bg-gray-100 px-1 rounded">{student.id}</span>
                       <span className="hidden sm:inline">•</span>
                       <div className="flex items-center gap-1">
                            <Calendar size={14} className="text-blue-500"/>
                            <select 
                                value={currentPeriodId} 
                                onChange={(e) => {
                                    // Keep studentId, change period param, this triggers useEffect to reload
                                    navigate(`?period=${e.target.value}`, { replace: true });
                                }}
                                className="bg-white border border-gray-300 text-gray-700 text-xs font-bold rounded focus:ring-blue-500 focus:border-blue-500 p-1 outline-none"
                            >
                                {periods.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                       </div>
                       <span className="hidden sm:inline">•</span>
                       <span className={`font-bold uppercase text-xs px-2 py-0.5 rounded ${scoreData?.status === 'finalized' ? 'bg-green-100 text-green-700' : 'bg-blue-50 text-blue-600'}`}>
                           {scoreData?.status || 'Mới tạo'}
                       </span>
                   </div>
               </div>
           </div>
           
           {/* Auto-Save Indicator */}
           {!isLocked && (
            <div className="flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-full bg-gray-50 border border-gray-100 whitespace-nowrap self-end md:self-auto">
                    {autoSaveStatus === 'saving' && (
                        <>
                            <RefreshCw size={14} className="animate-spin text-blue-500"/> 
                            <span className="text-blue-600">Đang lưu...</span>
                        </>
                    )}
                    {autoSaveStatus === 'saved' && (
                        <>
                            <CheckCircle size={14} className="text-green-500"/>
                            <span className="text-green-600">Đã tự động lưu</span>
                        </>
                    )}
                    {autoSaveStatus === 'error' && (
                        <>
                            <CloudOff size={14} className="text-red-500"/>
                            <span className="text-red-600">Lỗi lưu</span>
                        </>
                    )}
                    {autoSaveStatus === 'idle' && (
                        <>
                            <Cloud size={14} className="text-gray-400"/>
                            <span className="text-gray-400">Sẵn sàng</span>
                        </>
                    )}
            </div>
           )}
       </div>

       <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
           <div className="overflow-x-auto">
               <table className="w-auto text-left border-collapse">
                   <thead className="bg-gray-100 text-gray-700 text-xs font-bold sticky top-0 z-10 uppercase tracking-tight">
                       <tr>
                           <th className="p-2 border text-left whitespace-nowrap">Nội dung đánh giá</th>
                           <th className="p-2 border text-center w-12">Max</th>
                           <th className="p-2 border text-center w-28">Minh chứng</th>
                           <th className="p-2 border text-center w-16">SV</th>
                           <th className="p-2 border text-center w-16">Lớp</th>
                           <th className="p-2 border text-center w-16">BCH</th>
                           <th className="p-2 border text-center w-16">Khoa</th>
                       </tr>
                   </thead>
                   <tbody className="text-xs">
                       {CRITERIA.map(c => {
                           // Render Header Row
                           if (!c.parent) {
                               return (
                                   <tr key={c.id} className="bg-blue-50/50 font-bold text-blue-900 border-t border-blue-100">
                                       <td className="p-2 border">{c.content}</td>
                                       <td className="p-2 border text-center">{c.max}</td>
                                       <td className="p-2 border bg-gray-50"></td>
                                       <td className="p-2 border text-center">{getGroupTotal(selfScores, c.id)}</td>
                                       <td className="p-2 border text-center">{showClass ? getGroupTotal(classScores, c.id) : 0}</td>
                                       <td className="p-2 border text-center">{showBCH ? getGroupTotal(bchScores, c.id) : 0}</td>
                                       <td className="p-2 border text-center">{showFaculty ? getGroupTotal(facultyScores, c.id) : 0}</td>
                                   </tr>
                               );
                           }
                           // Render Item Row
                           return (
                               <tr key={c.id} className="hover:bg-gray-50 border-b border-gray-50">
                                   <td className="p-1 pl-4 border-r border-gray-100 align-middle leading-tight whitespace-nowrap">{c.content}</td>
                                   <td className="p-1 border-r border-gray-100 text-center text-gray-400 font-medium">{c.max}</td>
                                   <td className="p-1 border-r border-gray-100 text-center">
                                       {renderProofCell(c)}
                                   </td>
                                   <td className="p-1 border-r border-gray-100">{renderInput(c, 'self', selfScores, setSelfScores)}</td>
                                   <td className="p-1 border-r border-gray-100">{renderInput(c, 'class', classScores, setClassScores)}</td>
                                   <td className="p-1 border-r border-gray-100">{renderInput(c, 'bch', bchScores, setBchScores)}</td>
                                   <td className="p-1">{renderInput(c, 'faculty', facultyScores, setFacultyScores)}</td>
                               </tr>
                           );
                       })}
                       <tr className="bg-yellow-50 font-bold text-red-700 text-base border-t-2 border-yellow-200">
                           <td className="p-3 border text-right">TỔNG KẾT:</td>
                           <td className="p-3 border text-center">100</td>
                           <td className="p-3 border"></td>
                           <td className="p-3 border text-center">{calculateTotal(selfScores)}</td>
                           <td className="p-3 border text-center">{showClass ? calculateTotal(classScores) : 0}</td>
                           <td className="p-3 border text-center">{showBCH ? calculateTotal(bchScores) : 0}</td>
                           <td className="p-3 border text-center">{showFaculty ? calculateTotal(facultyScores) : 0}</td>
                       </tr>
                   </tbody>
               </table>
           </div>
       </div>

       <div className="mt-4 flex flex-wrap justify-end gap-3 sticky bottom-0 bg-white/90 backdrop-blur p-2 border-t border-gray-200 shadow-lg">
           <button 
                onClick={handleExportPDF} 
                disabled={isExporting}
                className="px-4 py-2 bg-purple-600 text-white border border-purple-700 rounded-lg hover:bg-purple-700 text-sm font-bold flex items-center gap-2 mr-auto"
           >
               {isExporting ? <Loader2 size={16} className="animate-spin"/> : <Download size={16} />}
               Xuất Phiếu PDF
           </button>

           {/* UN-SUBMIT BUTTON FOR STUDENTS */}
           {!isLocked && currentUser?.role === 'student' && scoreData?.status === 'submitted' && (
               <button 
                  onClick={handleUnsubmit}
                  className="px-4 py-2 bg-yellow-100 text-yellow-800 border border-yellow-300 rounded-lg hover:bg-yellow-200 text-sm font-bold flex items-center gap-2"
               >
                   <Undo2 size={16} /> Hủy nộp (Sửa lại)
               </button>
           )}

           <button onClick={() => handleSave(false)} disabled={isLocked} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium disabled:opacity-50">Lưu nháp</button>
           
           {/* Only show Submit if allowed to edit and not already submitted/finalized (unless unsubmitted) */}
           {canEdit(currentUser?.role === 'monitor' ? 'class' : (currentUser?.role === 'student' ? 'self' : 'self')) && (
                <button onClick={() => handleSave(true)} disabled={isLocked} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center gap-2 disabled:bg-gray-400">
                    <CheckCircle size={16}/> Lưu & Gửi
                </button>
           )}
       </div>
    </div>
  );
};

export default DRLForm;