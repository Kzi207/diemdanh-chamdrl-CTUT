import React, { useState, useEffect } from 'react';
import { getCurrentUser, getStudents, getDRLScores, getClasses, getGradingPeriods, createUsersBatch, resetUsersBatch } from '../services/storage';
import { User, Student, DRLScore, ClassGroup, GradingPeriod } from '../types';
import { useNavigate, useLocation } from 'react-router-dom';
import { Award, Download, ArrowLeft, AlertTriangle, RefreshCw, UserPlus, FileText, RefreshCcw, CheckSquare, Square, Users, Settings, FolderArchive } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import JSZip from 'jszip';

// Dữ liệu tiêu chí để sinh PDF (Copy từ DRLForm để đảm bảo consistency)
const CRITERIA = [
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
    { id: 'II', content: 'II. Đánh giá về ý thức chấp hành nội quy, quy chế', max: 25 },
    { id: 'II.1', content: '1. Ý thức, thái độ trong học tập (Đi học đầy đủ, đúng giờ)', max: 5, parent: 'II' },
    { id: 'II.2', content: '2. Chấp hành tốt nội quy, quy chế Nhà trường', max: 5, parent: 'II' },
    { id: 'II.3', content: '3. Thực hiện tốt quy chế thi, kiểm tra', max: 5, parent: 'II' },
    { id: 'II.4', content: '4. Chấp hành quy định thư viện', max: 5, parent: 'II' },
    { id: 'II.5', content: '5. Bảo vệ tài sản, phòng học', max: 5, parent: 'II' },
    { id: 'II.6', content: '6. Thực hiện đăng ký ngoại trú', max: 5, parent: 'II' },
    { id: 'II.7', content: '7. Mặc đồng phục đúng quy định', max: 5, parent: 'II' },
    { id: 'II.8', content: '8. Tham gia sinh hoạt lớp với CVHT', max: 5, parent: 'II' },
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

const DRLManager: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = getCurrentUser();
  
  // Data State
  const [students, setStudents] = useState<Student[]>([]);
  const [scores, setScores] = useState<DRLScore[]>([]);
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [periods, setPeriods] = useState<GradingPeriod[]>([]);
  
  // Selection State
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedPeriodId, setSelectedPeriodId] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]); // New: Track selected students
  
  // UI State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreatingAccounts, setIsCreatingAccounts] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isExportingZip, setIsExportingZip] = useState(false);
  const [zipProgress, setZipProgress] = useState(0);

  // 1. Initial Load (Runs once)
  useEffect(() => {
    if (currentUser?.role === 'student') {
        navigate(`/drl/form/${currentUser.username}`, { replace: true });
        return;
    }
    
    const initData = async () => {
        try {
            const [cls, per] = await Promise.all([getClasses(), getGradingPeriods()]);
            setClasses(cls);
            setPeriods(per);
            
            // Default selections
            if (per.length > 0) setSelectedPeriodId(per[per.length - 1].id); // Select latest
            else setSelectedPeriodId('HK1_2024'); // Fallback default
            
            // Auto select class for monitor
            if (currentUser?.role === 'monitor' && currentUser.classId) {
                setSelectedClassId(currentUser.classId);
            }
        } catch (e) {
            console.error("Init Error", e);
        }
    };
    initData();
  }, []);

  // 2. Load Students & Scores when filters change
  useEffect(() => {
    if (!currentUser || currentUser.role === 'student') return;
    loadTableData();
  }, [selectedClassId, selectedPeriodId]);

  const loadTableData = async () => {
    setLoading(true);
    setError(null);
    setStudents([]); 
    setSelectedStudentIds([]); // Reset selection when context changes
    
    try {
        let targetStudents: Student[] = [];

        // Logic tải sinh viên
        if (selectedClassId) {
            targetStudents = await getStudents(selectedClassId);
            setStudents(targetStudents);
        }

        // Tải điểm
        if (selectedPeriodId) {
             const allScores = await getDRLScores();
             const currentScores = allScores.filter(s => s.semester === selectedPeriodId);
             setScores(currentScores);
        }
    } catch (err) {
        console.error(err);
        setError((err as Error).message);
    } finally {
        setLoading(false);
    }
  };

  // --- SELECTION LOGIC ---
  const toggleSelectAll = () => {
      if (selectedStudentIds.length === students.length) {
          setSelectedStudentIds([]);
      } else {
          setSelectedStudentIds(students.map(s => s.id));
      }
  };

  const toggleSelectStudent = (id: string) => {
      if (selectedStudentIds.includes(id)) {
          setSelectedStudentIds(selectedStudentIds.filter(sid => sid !== id));
      } else {
          setSelectedStudentIds([...selectedStudentIds, id]);
      }
  };

  // --- ACCOUNT MANAGEMENT ---
  const handleCreateAccounts = async () => {
      if (!selectedClassId || students.length === 0) return;
      
      const confirmMsg = `Bạn có chắc muốn tạo ${students.length} tài khoản cho lớp này? \n\nTài khoản cũ sẽ KHÔNG bị thay đổi mật khẩu.`;
      if (!window.confirm(confirmMsg)) return;

      setIsCreatingAccounts(true);
      try {
          const newUsers: User[] = students.map(s => {
              const cleanId = s.id.trim();
              const password = cleanId.length > 3 ? cleanId.slice(-3) : cleanId;
              return {
                  username: cleanId,
                  password: password,
                  name: `${s.lastName} ${s.firstName}`.trim(),
                  role: 'student',
                  classId: s.classId
              };
          });

          const res = await createUsersBatch(newUsers);
          alert(`Đã thêm mới ${res.count} tài khoản! Các tài khoản đã tồn tại không bị ảnh hưởng.`);
      } catch (e) {
          alert("Lỗi khi tạo tài khoản: " + (e as Error).message);
      } finally {
          setIsCreatingAccounts(false);
      }
  };

  const handleResetSelectedPasswords = async () => {
        if (selectedStudentIds.length === 0) {
            alert("Vui lòng chọn ít nhất một sinh viên để cấp lại mật khẩu.");
            return;
        }
        
        const confirmMsg = `⚠️ CẢNH BÁO: Bạn có chắc muốn CẤP LẠI MẬT KHẨU cho ${selectedStudentIds.length} sinh viên đã chọn?\n\nMật khẩu sẽ được đặt về mặc định (3 số cuối MSSV).`;
        if (!window.confirm(confirmMsg)) return;

        setIsCreatingAccounts(true);
        try {
             // Filter only selected students
             const targetStudents = students.filter(s => selectedStudentIds.includes(s.id));
             
             const updates: User[] = targetStudents.map(s => {
                const cleanId = s.id.trim();
                const password = cleanId.length > 3 ? cleanId.slice(-3) : cleanId;
                return {
                    username: cleanId,
                    password: password,
                    name: `${s.lastName} ${s.firstName}`.trim(),
                    role: 'student',
                    classId: s.classId
                };
            });
            const res = await resetUsersBatch(updates);
            alert(`Thành công! Đã cấp lại mật khẩu cho ${res.count} tài khoản.`);
            setSelectedStudentIds([]); // Clear selection
        } catch (e) {
            alert("Lỗi: " + (e as Error).message);
        } finally {
            setIsCreatingAccounts(false);
        }
  };

  // --- PDF EXPORT FUNCTION ---
  const handleExportAccountsPDF = async () => {
      if (!selectedClassId || students.length === 0) {
          alert("Vui lòng chọn lớp và đảm bảo có sinh viên.");
          return;
      }
      setIsGeneratingPDF(true);
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

        const className = classes.find(c => c.id === selectedClassId)?.name || selectedClassId;
        const pageWidth = doc.internal.pageSize.getWidth(); 

        doc.setFontSize(11);
        doc.text("TRƯỜNG ĐH KỸ THUẬT - CÔNG NGHỆ CẦN THƠ", pageWidth/2, 15, { align: 'center' });
        doc.setFontSize(14);
        doc.text(`DANH SÁCH TÀI KHOẢN - LỚP ${className}`, pageWidth/2, 25, { align: "center" });

        const startY = 35;
        const rowHeight = 8;
        let yPos = startY;
        const xSTT=15, xMSSV=30, xName=60, xPass=160;
        
        // Header
        doc.setFontSize(10);
        doc.setFillColor(220, 220, 220);
        doc.rect(xSTT, yPos, 180, rowHeight, "F");
        doc.text("STT", xSTT+2, yPos+5);
        doc.text("MSSV", xMSSV+2, yPos+5);
        doc.text("HỌ VÀ TÊN", xName+2, yPos+5);
        doc.text("MẬT KHẨU", xPass+2, yPos+5);
        yPos += rowHeight;

        students.forEach((s, index) => {
            if (yPos > 280) { doc.addPage(); yPos = 20; }
            const cleanId = s.id.trim();
            const password = cleanId.length > 3 ? cleanId.slice(-3) : cleanId;
            
            doc.text(`${index + 1}`, xSTT+2, yPos+5);
            doc.text(cleanId, xMSSV+2, yPos+5);
            doc.text(`${s.lastName} ${s.firstName}`, xName+2, yPos+5);
            doc.text(password, xPass+2, yPos+5);
            doc.line(xSTT, yPos+rowHeight, 195, yPos+rowHeight); // Bottom line
            yPos += rowHeight;
        });

        doc.save(`TK_Lop_${className}.pdf`);
      } catch (e) {
          alert("Lỗi PDF: " + (e as Error).message);
      } finally {
          setIsGeneratingPDF(false);
      }
  };

  // --- ZIP EXPORT FUNCTION (BULK DRL + PROOFS) ---
  const handleExportZip = async () => {
      const targets = selectedStudentIds.length > 0 
          ? students.filter(s => selectedStudentIds.includes(s.id))
          : students;

      if (targets.length === 0) {
          alert("Vui lòng chọn lớp hoặc sinh viên để xuất.");
          return;
      }
      
      setIsExportingZip(true);
      setZipProgress(0);

      try {
          const zip = new JSZip();
          const fontUrl = 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Regular.ttf';
          const fontResponse = await fetch(fontUrl);
          const fontBuffer = await fontResponse.arrayBuffer();
          let binary = '';
          const bytes = new Uint8Array(fontBuffer);
          for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
          const base64Font = btoa(binary);

          // Helper to calculate score for a group
          const getGroupTotal = (scoresObj: Record<string, number>, groupId: string) => {
                let groupSum = 0;
                const children = CRITERIA.filter(c => c.parent === groupId);
                children.forEach(child => { groupSum += (scoresObj[child.id] || 0); });
                return groupSum;
          };
          
          const calculateTotal = (scoresObj: Record<string, number>) => {
                let finalTotal = 0;
                const groups = CRITERIA.filter(c => !c.parent);
                groups.forEach(group => {
                    let groupSum = getGroupTotal(scoresObj, group.id);
                    finalTotal += Math.min(groupSum, group.max);
                });
                return Math.min(100, Math.max(0, finalTotal));
          };

          for (let i = 0; i < targets.length; i++) {
              const student = targets[i];
              // FIX: Cast fallback to DRLScore to avoid type error on 'status' access later
              const score = scores.find(s => s.studentId === student.id) || ({ details: {}, status: 'draft' } as unknown as DRLScore);
              const details = score.details || {};
              const selfScores = details.self || {};
              const classScores = details.class || {};
              const bchScores = details.bch || {};
              const facultyScores = details.faculty || {};
              const proofs = details.proofs || {};

              // 1. Create Folder
              const folderName = `${student.id}_${student.lastName}_${student.firstName}`.replace(/[^a-zA-Z0-9_\u00C0-\u1EF9]/g, '_');
              const studentFolder = zip.folder(folderName);
              if (!studentFolder) continue;

              // 2. Generate PDF
              const doc = new jsPDF();
              doc.addFileToVFS('Roboto-Regular.ttf', base64Font);
              doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
              doc.setFont('Roboto');
              
              const pageWidth = doc.internal.pageSize.getWidth();
              const pageHeight = doc.internal.pageSize.getHeight();
              let yPos = 20;

              // Title & Info
              doc.setFontSize(14);
              doc.text('PHIẾU ĐÁNH GIÁ ĐIỂM RÈN LUYỆN', pageWidth/2, yPos, { align: 'center' });
              yPos += 10;
              doc.setFontSize(11);
              doc.text(`Họ tên: ${student.lastName} ${student.firstName}`, 15, yPos);
              doc.text(`MSSV: ${student.id}`, 140, yPos);
              yPos += 7;
              doc.text(`Đợt: ${selectedPeriodId}`, 15, yPos);
              doc.text(`Trạng thái: ${score.status || 'Chưa chấm'}`, 140, yPos);
              yPos += 10;

              // Table Headers
              const cols = [{ header: 'Nội dung', w: 100 }, { header: 'Max', w: 15 }, { header: 'SV', w: 20 }, { header: 'Lớp', w: 20 }, { header: 'BCH', w: 20 }, { header: 'Khoa', w: 15 }];
              let startX = 15;
              let currentX = startX;
              doc.setFillColor(230, 230, 230);
              doc.setFontSize(10);
              doc.rect(startX, yPos, 190, 8, 'F');
              cols.forEach(c => { doc.text(c.header, currentX + 2, yPos + 6); currentX += c.w; });
              yPos += 8;

              // Table Content
              CRITERIA.forEach(c => {
                 if (yPos > pageHeight - 20) { doc.addPage(); yPos = 20; }
                 const isGroup = !c.parent;
                 const rowHeight = isGroup ? 8 : 12;
                 
                 if(isGroup) {
                    doc.setFillColor(245, 245, 255);
                    doc.rect(startX, yPos, 190, rowHeight, 'F');
                    doc.text(c.content, startX + 2, yPos + 6);
                    doc.text(String(c.max), startX + 100 + 2, yPos + 6);
                    let x = startX + 115;
                    doc.text(String(getGroupTotal(selfScores, c.id)), x + 5, yPos + 6);
                    x += 20;
                    doc.text(String(getGroupTotal(classScores, c.id)), x + 5, yPos + 6);
                    x += 20;
                    doc.text(String(getGroupTotal(bchScores, c.id)), x + 5, yPos + 6);
                    x += 20;
                    doc.text(String(getGroupTotal(facultyScores, c.id)), x + 5, yPos + 6);
                    yPos += rowHeight;
                 } else {
                    const splitText = doc.splitTextToSize(c.content, 95);
                    const dynamicHeight = Math.max(8, splitText.length * 5 + 4);
                    if (yPos + dynamicHeight > pageHeight - 10) { doc.addPage(); yPos = 20; }
                    
                    doc.text(splitText, startX + 2, yPos + 5);
                    doc.text(String(c.max), startX + 100 + 2, yPos + 5);
                    let x = startX + 115;
                    doc.text(String(selfScores[c.id] || 0), x + 5, yPos + 5);
                    x += 20;
                    doc.text(String(classScores[c.id] || 0), x + 5, yPos + 5);
                    x += 20;
                    doc.text(String(bchScores[c.id] || 0), x + 5, yPos + 5);
                    x += 20;
                    doc.text(String(facultyScores[c.id] || 0), x + 5, yPos + 5);
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
              doc.text(String(calculateTotal(classScores)), x + 5, yPos + 7);
              x += 20;
              doc.text(String(calculateTotal(bchScores)), x + 5, yPos + 7);
              x += 20;
              doc.text(String(calculateTotal(facultyScores)), x + 5, yPos + 7);

              const pdfBlob = doc.output('blob');
              studentFolder.file(`Phieu_DRL_${student.id}.pdf`, pdfBlob);

              // 3. Download Proofs
              const proofEntries = Object.entries(proofs);
              for (const [criteriaId, url] of proofEntries) {
                  try {
                      // Normalize URL
                      const validUrl = (url as string).startsWith('http') ? (url as string) : `https://database.kzii.site${(url as string).startsWith('/') ? '' : '/'}${(url as string)}`;
                      const response = await fetch(validUrl);
                      if (response.ok) {
                          const blob = await response.blob();
                          // Get extension
                          const ext = (url as string).split('.').pop() || 'jpg';
                          // Clean criteria ID for filename
                          const safeCriteria = criteriaId.replace(/[^a-zA-Z0-9]/g, '_');
                          studentFolder.file(`MinhChung_${safeCriteria}.${ext}`, blob);
                      }
                  } catch (e) {
                      console.error(`Failed to fetch proof for ${student.id}`, e);
                      studentFolder.file(`Error_${criteriaId}.txt`, `Failed to download: ${url}`);
                  }
              }

              // Update Progress
              setZipProgress(Math.round(((i + 1) / targets.length) * 100));
          }

          // Generate Zip
          const content = await zip.generateAsync({ type: "blob" });
          const className = classes.find(c => c.id === selectedClassId)?.name || 'Bulk';
          
          // Trigger Download
          const link = document.createElement('a');
          link.href = URL.createObjectURL(content);
          link.download = `DRL_Proofs_${className}_${selectedPeriodId}.zip`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

      } catch (e) {
          alert("Lỗi xuất ZIP: " + (e as Error).message);
      } finally {
          setIsExportingZip(false);
          setZipProgress(0);
      }
  };

  const getScoreStatus = (studentId: string) => {
      const s = scores.find(sc => sc.studentId === studentId);
      if (!s) return { label: 'Chưa chấm', color: 'text-gray-500 bg-gray-100' };
      if (s.status === 'finalized') return { label: 'Đã duyệt', color: 'text-green-700 bg-green-100 border-green-200' };
      if (s.status === 'bch_approved') return { label: 'ĐK chờ', color: 'text-blue-700 bg-blue-100 border-blue-200' };
      if (s.status === 'class_approved') return { label: 'BCH chờ', color: 'text-indigo-700 bg-indigo-100 border-indigo-200' };
      if (s.status === 'submitted') return { label: 'Lớp chờ', color: 'text-orange-700 bg-orange-100 border-orange-200' };
      return { label: 'Nháp', color: 'text-gray-600 bg-gray-100' };
  };

  const getFinalScore = (studentId: string) => {
      const s = scores.find(sc => sc.studentId === studentId);
      return s ? (s.finalScore || s.facultyScore || s.bchScore || s.classScore || s.selfScore) : '-';
  };

  const exportExcel = () => {
      if (students.length === 0) { alert("Danh sách trống!"); return; }
      const data = students.map((std, idx) => {
          const s = scores.find(sc => sc.studentId === std.id);
          const status = s?.status || 'draft';
          const isClassGraded = ['class_approved', 'bch_approved', 'finalized'].includes(status);
          const isBchGraded = ['bch_approved', 'finalized'].includes(status);
          const isFacultyGraded = ['finalized'].includes(status);
          const finalScore = s?.finalScore || (isFacultyGraded ? s?.facultyScore : (isBchGraded ? s?.bchScore : (isClassGraded ? s?.classScore : s?.selfScore))) || 0;

          return {
              'STT': idx + 1,
              'MSSV': std.id,
              'Họ Tên': `${std.lastName} ${std.firstName}`,
              'Ngày Sinh': std.dob,
              'Tự chấm': s?.selfScore || 0,
              'Lớp chấm': isClassGraded ? (s?.classScore || 0) : 0,
              'BCH chấm': isBchGraded ? (s?.bchScore || 0) : 0,
              'Đoàn khoa': isFacultyGraded ? (s?.facultyScore || 0) : 0,
              'Tổng kết': finalScore
          };
      });
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "DRL");
      const className = selectedClassId || 'All';
      XLSX.writeFile(wb, `DRL_${selectedPeriodId}_${className}.xlsx`);
  };

  // Stats
  const stats = {
      total: students.length,
      graded: students.filter(std => scores.some(s => s.studentId === std.id && s.status !== 'draft')).length,
      avg: 0,
  };
  if (stats.graded > 0) {
      let sum = 0;
      students.forEach(std => {
          const s = scores.find(sc => sc.studentId === std.id);
          if (s && s.finalScore) sum += s.finalScore;
      });
      stats.avg = Math.round(sum / stats.graded);
  }

  const isAdminOrBCH = ['admin', 'bch', 'doankhoa'].includes(currentUser?.role || '');

  return (
    <div className="p-2 max-w-full">
      {/* Header Compact */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-2 mb-2 bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center gap-2">
             <button onClick={() => navigate('/')} className="p-1.5 hover:bg-gray-100 rounded-full text-gray-600 transition-colors">
                <ArrowLeft size={18} />
             </button>
             <div>
                <h1 className="text-base font-bold text-gray-800 flex items-center gap-1">
                    <Award size={18} className="text-yellow-500"/> Quản lý ĐRL
                </h1>
                <div className="text-xs text-gray-500">HK: <span className="font-bold text-blue-600">{selectedPeriodId}</span></div>
             </div>
        </div>
        
        <div className="flex flex-wrap gap-1 items-center justify-end">
            {/* Period Selector */}
            <div className="flex items-center bg-gray-50 rounded border p-0.5">
                <select 
                    className="p-1 text-xs bg-transparent outline-none min-w-[80px]"
                    value={selectedPeriodId}
                    onChange={e => setSelectedPeriodId(e.target.value)}
                >
                    {periods.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    {periods.length === 0 && <option value="HK1_2024">HK1_2024</option>}
                </select>
                {currentUser?.role === 'admin' && (
                    <button 
                        onClick={() => navigate('/drl/periods')}
                        className="p-1 hover:bg-gray-200 rounded text-indigo-600"
                        title="Đi tới trang Quản lý Đợt chấm"
                    >
                        <Settings size={14}/>
                    </button>
                )}
            </div>

            {/* Class Selector */}
            {isAdminOrBCH && (
                <div className="flex items-center gap-1">
                    <select 
                        className="border p-1.5 rounded text-xs bg-gray-50 shadow-sm outline-none focus:ring-1 ring-blue-500 min-w-[100px]"
                        value={selectedClassId}
                        onChange={e => setSelectedClassId(e.target.value)}
                    >
                        <option value="">-- Chọn Lớp --</option>
                        {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    {/* Link to Class Management for full edit */}
                    {currentUser?.role === 'admin' && (
                        <button 
                            onClick={() => navigate('/classes')}
                            className="p-1.5 bg-gray-100 text-gray-600 rounded border hover:bg-gray-200"
                            title="Quản lý Danh sách Sinh viên (Thêm/Sửa/Xóa)"
                        >
                            <Users size={14}/>
                        </button>
                    )}
                </div>
            )}
            
            {/* Account Actions Group */}
            {currentUser?.role === 'admin' && selectedClassId && (
                <div className="flex items-center gap-1 pl-2 border-l border-gray-200 ml-1">
                    <button 
                        onClick={handleCreateAccounts}
                        disabled={isCreatingAccounts}
                        className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-1.5 rounded text-xs flex items-center gap-1 hover:bg-indigo-100 disabled:opacity-50"
                        title="Tạo TK tự động cho toàn bộ lớp (nếu chưa có)"
                    >
                        <UserPlus size={14}/> Auto TK
                    </button>

                    <button 
                        onClick={handleResetSelectedPasswords}
                        disabled={isCreatingAccounts || selectedStudentIds.length === 0}
                        className={`px-2 py-1.5 rounded text-xs flex items-center gap-1 font-medium border transition-colors ${selectedStudentIds.length > 0 ? 'bg-red-600 text-white border-red-700 hover:bg-red-700' : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'}`}
                        title={selectedStudentIds.length > 0 ? `Cấp lại mật khẩu cho ${selectedStudentIds.length} SV đã chọn` : "Chọn SV để cấp lại mật khẩu"}
                    >
                        <RefreshCcw size={14}/> Cấp MK {selectedStudentIds.length > 0 ? `(${selectedStudentIds.length})` : ''}
                    </button>

                     <button 
                        onClick={handleExportAccountsPDF}
                        disabled={isGeneratingPDF}
                        className="bg-orange-50 text-orange-700 border border-orange-200 px-2 py-1.5 rounded text-xs flex items-center gap-1 hover:bg-orange-100 disabled:opacity-50"
                        title="Xuất file PDF tài khoản"
                    >
                        {isGeneratingPDF ? <RefreshCw size={14} className="animate-spin"/> : <FileText size={14}/>} PDF
                    </button>
                </div>
            )}

            {isAdminOrBCH && (
                <button 
                    onClick={handleExportZip}
                    disabled={isExportingZip || students.length === 0}
                    className="bg-purple-600 text-white px-3 py-1.5 rounded text-xs flex items-center gap-1 hover:bg-purple-700 disabled:bg-gray-400 font-medium ml-1"
                >
                    {isExportingZip ? (
                        <>
                           <RefreshCw size={14} className="animate-spin"/> {zipProgress}%
                        </>
                    ) : (
                        <><FolderArchive size={14}/> Xuất ZIP</>
                    )}
                </button>
            )}

            <button onClick={exportExcel} disabled={students.length === 0} className="bg-green-600 text-white px-3 py-1.5 rounded text-xs flex items-center gap-1 hover:bg-green-700 disabled:bg-gray-400 font-medium ml-1">
                <Download size={14}/> Excel
            </button>
        </div>
      </div>

      {error ? (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg shadow-sm mb-4">
            <div className="flex items-start gap-3">
                <AlertTriangle size={24} className="text-red-600"/>
                <div>
                    <h2 className="text-base font-bold text-red-800">Lỗi tải dữ liệu</h2>
                    <p className="text-sm text-red-700 mb-2">{error}</p>
                    <button onClick={loadTableData} className="inline-flex items-center gap-1 px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors">
                        <RefreshCw size={14}/> Thử lại
                    </button>
                </div>
            </div>
        </div>
      ) : (
      <>
        {/* Stats Compact */}
        {selectedClassId && (
            <div className="grid grid-cols-3 gap-2 mb-2">
                <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-200 flex flex-col items-center justify-center">
                    <div className="text-gray-500 text-[10px] uppercase font-bold">Tổng SV</div>
                    <div className="text-lg font-bold leading-none text-gray-800">{stats.total}</div>
                </div>
                <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-200 flex flex-col items-center justify-center">
                    <div className="text-gray-500 text-[10px] uppercase font-bold">Đã chấm</div>
                    <div className="text-lg font-bold text-blue-600 leading-none">{stats.graded} <span className="text-gray-400 text-xs font-normal">/ {stats.total}</span></div>
                </div>
                <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-200 flex flex-col items-center justify-center">
                    <div className="text-gray-500 text-[10px] uppercase font-bold">Điểm TB</div>
                    <div className="text-lg font-bold text-orange-600 leading-none">{stats.avg}</div>
                </div>
            </div>
        )}

        {/* Table Compact */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[calc(100vh-180px)]">
            {loading ? (
                <div className="p-10 text-center text-gray-500 flex flex-col items-center justify-center h-full">
                    <RefreshCw className="animate-spin mb-2" size={20}/>
                    <span className="text-xs">Đang tải danh sách...</span>
                </div>
            ) : (
                <div className="overflow-auto flex-1">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-100 text-gray-700 text-xs uppercase sticky top-0 z-10 shadow-sm">
                            <tr>
                                {/* Select All Checkbox */}
                                {currentUser?.role === 'admin' && (
                                    <th className="p-2 border-b w-8 text-center">
                                        <button onClick={toggleSelectAll} className="text-gray-500 hover:text-blue-600">
                                            {selectedStudentIds.length > 0 && selectedStudentIds.length === students.length ? 
                                                <CheckSquare size={16}/> : <Square size={16}/>
                                            }
                                        </button>
                                    </th>
                                )}
                                <th className="p-2 border-b w-24 whitespace-nowrap">MSSV</th>
                                <th className="p-2 border-b whitespace-nowrap">Họ Tên</th>
                                <th className="p-2 border-b text-center w-28 whitespace-nowrap">Trạng thái</th>
                                <th className="p-2 border-b text-center w-16 whitespace-nowrap">Điểm</th>
                                <th className="p-2 border-b text-center w-20 whitespace-nowrap">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-xs">
                            {students.map(s => {
                                const status = getScoreStatus(s.id);
                                const isSelected = selectedStudentIds.includes(s.id);
                                return (
                                    <tr key={s.id} className={`hover:bg-blue-50 transition-colors group ${isSelected ? 'bg-blue-50' : ''}`}>
                                        {/* Individual Checkbox */}
                                        {currentUser?.role === 'admin' && (
                                            <td className="p-1.5 px-2 text-center border-r border-gray-50">
                                                <button onClick={() => toggleSelectStudent(s.id)} className={`transition-colors ${isSelected ? 'text-blue-600' : 'text-gray-300 hover:text-gray-500'}`}>
                                                    {isSelected ? <CheckSquare size={16}/> : <Square size={16}/>}
                                                </button>
                                            </td>
                                        )}
                                        <td className="p-1.5 px-2 font-medium border-r border-gray-50 text-gray-800">{s.id}</td>
                                        <td className="p-1.5 px-2 border-r border-gray-50 font-medium text-gray-700">{s.lastName} {s.firstName}</td>
                                        <td className="p-1.5 px-2 text-center border-r border-gray-50">
                                            <span className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase whitespace-nowrap ${status.color}`}>
                                                {status.label}
                                            </span>
                                        </td>
                                        <td className="p-1.5 px-2 text-center font-bold border-r border-gray-50 text-gray-800">{getFinalScore(s.id)}</td>
                                        <td className="p-1.5 px-2 text-center">
                                            <button 
                                                onClick={() => navigate(`/drl/form/${s.id}?period=${selectedPeriodId}`)}
                                                className="bg-white border border-blue-200 text-blue-600 hover:bg-blue-600 hover:text-white px-2 py-1 rounded text-[11px] font-bold transition-all shadow-sm group-hover:border-blue-500"
                                            >
                                                Chấm
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                            {students.length === 0 && (
                                <tr>
                                    <td colSpan={currentUser?.role === 'admin' ? 6 : 5} className="p-10 text-center text-gray-400 text-xs">
                                        {selectedClassId ? 'Không có sinh viên nào trong lớp này.' : 'Vui lòng chọn Lớp để xem danh sách.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
      </>
      )}
    </div>
  );
};

export default DRLManager;