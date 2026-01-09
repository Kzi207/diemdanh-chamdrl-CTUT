import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import jsQR from 'jsqr';
import { markAttendance, getActivities } from '../services/storage';
import { Activity, Student } from '../types';
import { ArrowLeft, Camera, CheckCircle, XCircle, AlertCircle, Image as ImageIcon } from 'lucide-react';

const AttendanceScanner: React.FC = () => {
  const { activityId } = useParams<{ activityId: string }>();
  const navigate = useNavigate();
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [activity, setActivity] = useState<Activity | null>(null);
  const [cameraError, setCameraError] = useState<string>('');
  const [scanResult, setScanResult] = useState<{
    status: 'idle' | 'success' | 'error' | 'duplicate';
    message: string;
    student?: Student;
  }>({ status: 'idle', message: 'Sẵn sàng quét...' });

  // Refs for logic control
  const lastScanTimeRef = useRef<number>(0);
  const lastCodeRef = useRef<string>('');
  const animationFrameRef = useRef<number>(0);
  const lastFrameTimeRef = useRef<number>(0); // Throttle FPS
  const isProcessingRef = useRef<boolean>(false); // Lock async calls

  useEffect(() => {
    const init = async () => {
      if (!activityId) return;
      const acts = await getActivities();
      const current = acts.find(a => a.id === activityId);
      if (current) setActivity(current);
    };
    init();
    startCamera();

    return () => {
      stopCamera();
    };
  }, [activityId]);

  const startCamera = async () => {
    setCameraError('');
    try {
      // Prefer environment (back) camera
      const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'environment',
            width: { ideal: 1280 }, // Request HD if possible
            height: { ideal: 720 }
          } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.play().catch(e => console.error("Play error:", e));
        requestAnimationFrame(tick);
      }
    } catch (err) {
      console.error("Camera error", err);
      let msg = 'Không thể truy cập camera.';
      if (!window.isSecureContext) {
          msg = 'Lỗi bảo mật: Trình duyệt chặn Camera trên kết nối HTTP (IP LAN). Hãy dùng "Tải ảnh lên" hoặc chạy trên Localhost.';
      } else {
          msg = 'Vui lòng cấp quyền truy cập Camera trên trình duyệt.';
      }
      setCameraError(msg);
      setScanResult({ status: 'error', message: msg });
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
  };

  const tick = () => {
    if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      
      // OPTIMIZATION: Throttle scanning to ~12 FPS (every 80ms)
      const now = Date.now();
      if (now - lastFrameTimeRef.current < 80) {
          animationFrameRef.current = requestAnimationFrame(tick);
          return;
      }
      lastFrameTimeRef.current = now;

      if (canvasRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        
        if (ctx) {
          // Increase analysis resolution for better sensitivity with larger frame
          // 720px is sufficient for fast processing and good detail
          const videoWidth = videoRef.current.videoWidth;
          const videoHeight = videoRef.current.videoHeight;
          const MAX_ANALYSIS_WIDTH = 720; 
          
          let analysisWidth = videoWidth;
          let analysisHeight = videoHeight;

          if (videoWidth > MAX_ANALYSIS_WIDTH) {
              const scale = MAX_ANALYSIS_WIDTH / videoWidth;
              analysisWidth = MAX_ANALYSIS_WIDTH;
              analysisHeight = videoHeight * scale;
          }

          canvas.width = analysisWidth;
          canvas.height = analysisHeight;
          
          ctx.drawImage(videoRef.current, 0, 0, analysisWidth, analysisHeight);
          
          const imageData = ctx.getImageData(0, 0, analysisWidth, analysisHeight);
          
          // SENSITIVITY FIX: Enable inversionAttempts: "attemptBoth"
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "attemptBoth",
          });

          if (code && code.data) {
            handleScan(code.data);
          }
        }
      }
    }
    animationFrameRef.current = requestAnimationFrame(tick);
  };

  const handleScan = async (codeData: string) => {
    const now = Date.now();
    
    // 1. Nếu đang xử lý API call thì bỏ qua
    if (isProcessingRef.current) return;

    // 2. LOGIC MÃ CŨ: Nếu mã vừa quét GIỐNG mã trước đó -> Chờ 3 giây
    if (codeData === lastCodeRef.current) {
        if (now - lastScanTimeRef.current < 3000) return;
    }

    // 3. LOGIC MÃ MỚI: Quét NGAY LẬP TỨC (Không delay)
    
    // --- START PROCESSING ---
    isProcessingRef.current = true;
    lastScanTimeRef.current = now;
    lastCodeRef.current = codeData;

    if (!activityId) {
        isProcessingRef.current = false;
        return;
    }

    try {
        const result = await markAttendance(activityId, codeData);
        
        if (result.status === 'success') {
            setScanResult({
                status: 'success',
                message: 'Điểm danh thành công!',
                student: result.student
            });
        } else if (result.status === 'already_present') {
            setScanResult({
                status: 'duplicate',
                message: 'Sinh viên này đã có mặt!',
                student: result.student
            });
        } else if (result.status === 'student_not_found') {
             setScanResult({
                status: 'error',
                message: `Mã không tồn tại: ${codeData}`
            });
        } else {
            setScanResult({
                status: 'error',
                message: `Lỗi hệ thống`
            });
        }
    } catch (e) {
        console.error(e);
        setScanResult({ status: 'error', message: 'Lỗi kết nối' });
    } finally {
        isProcessingRef.current = false;
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "attemptBoth" });
            
            if (code && code.data) {
                lastCodeRef.current = ''; 
                lastScanTimeRef.current = 0;
                handleScan(code.data);
            } else {
                setScanResult({
                    status: 'error',
                    message: 'Không tìm thấy mã QR trong ảnh.'
                });
            }
        };
        img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const getStatusColor = () => {
    switch(scanResult.status) {
      case 'success': return 'bg-green-100 border-green-500 text-green-800';
      case 'duplicate': return 'bg-yellow-100 border-yellow-500 text-yellow-800';
      case 'error': return 'bg-red-100 border-red-500 text-red-800';
      default: return 'bg-white border-gray-200 text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="p-4 bg-gray-800 text-white flex items-center gap-4 shadow-md z-10">
        <button onClick={() => navigate('/activities')} className="p-2 hover:bg-gray-700 rounded-full">
          <ArrowLeft />
        </button>
        <div className="overflow-hidden">
          <h1 className="font-bold text-lg whitespace-nowrap">Điểm Danh QR</h1>
          <p className="text-sm text-gray-400 truncate">{activity?.name || 'Đang tải...'}</p>
        </div>
      </div>

      {/* Camera Viewport */}
      <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-black">
        {!cameraError ? (
            <video 
                ref={videoRef} 
                className="absolute inset-0 w-full h-full object-cover opacity-90" 
                muted 
                playsInline
            />
        ) : (
            <div className="text-center p-6 max-w-sm">
                <div className="bg-red-900/50 text-red-200 p-4 rounded-lg border border-red-500 mb-4">
                    <AlertCircle className="mx-auto mb-2" size={32}/>
                    <p className="text-sm">{cameraError}</p>
                </div>
            </div>
        )}
        
        <canvas ref={canvasRef} className="hidden" />
        
        {/* Scanner Frame Overlay */}
        {!cameraError && (
            <div className="relative z-10 w-[90vw] h-[90vw] max-w-[500px] max-h-[500px] sm:w-[600px] sm:h-[600px] sm:max-w-none sm:max-h-none border-2 border-blue-400/80 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.6)]">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-500 -mt-0.5 -ml-0.5 rounded-tl-lg"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-500 -mt-0.5 -mr-0.5 rounded-tr-lg"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-500 -mb-0.5 -ml-0.5 rounded-bl-lg"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-500 -mb-0.5 -mr-0.5 rounded-br-lg"></div>
                
                {/* Scanning line animation */}
                <div className="absolute top-0 left-0 w-full h-0.5 bg-red-500/80 shadow-[0_0_10px_rgba(239,68,68,0.8)] animate-[scan_2s_ease-in-out_infinite]"></div>

                <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-white/80 text-xs font-medium px-2 py-1 bg-black/40 rounded-full backdrop-blur-sm">
                        Giữ mã QR trong khung
                    </p>
                </div>
            </div>
        )}

        {/* Upload Button */}
        <div className="absolute bottom-8 left-0 right-0 flex justify-center z-20 pointer-events-none">
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                accept="image/*" 
                className="hidden" 
            />
            <button 
                onClick={() => fileInputRef.current?.click()}
                className="pointer-events-auto bg-gray-800/80 backdrop-blur border border-gray-600 text-white px-5 py-2.5 rounded-full flex items-center gap-2 hover:bg-gray-700 transition-all font-medium text-sm shadow-lg"
            >
                <ImageIcon size={18} /> Tải ảnh QR
            </button>
        </div>
      </div>

      {/* Result Panel */}
      <div className="bg-white z-30 shadow-[0_-5px_20px_rgba(0,0,0,0.3)] pb-6 pt-4 px-4 rounded-t-2xl min-h-[180px]">
        <div className={`p-4 rounded-xl border-l-4 flex items-start gap-3 transition-all duration-200 ${getStatusColor()}`}>
          {scanResult.status === 'success' && <CheckCircle className="shrink-0 text-green-600 mt-1" size={24} />}
          {scanResult.status === 'duplicate' && <AlertCircle className="shrink-0 text-yellow-600 mt-1" size={24} />}
          {scanResult.status === 'error' && <XCircle className="shrink-0 text-red-600 mt-1" size={24} />}
          {scanResult.status === 'idle' && <Camera className="shrink-0 text-gray-400 mt-1" size={24} />}
          
          <div className="flex-1">
            <h3 className="font-bold text-lg leading-tight">
                {scanResult.status === 'idle' ? 'Sẵn sàng' : 
                 scanResult.status === 'success' ? 'Thành công' : 
                 scanResult.status === 'duplicate' ? 'Đã điểm danh' : 'Thất bại'}
            </h3>
            <p className="text-sm mt-1 font-medium opacity-90">{scanResult.message}</p>
            
            {scanResult.student && (
                <div className="mt-3 pt-3 border-t border-black/5 grid grid-cols-1 gap-1 text-sm">
                    <div className="font-bold text-base text-gray-900 uppercase">
                        {scanResult.student.lastName} {scanResult.student.firstName}
                    </div>
                    <div className="text-gray-600 font-mono">
                        MSSV: <span className="font-bold text-gray-800">{scanResult.student.id}</span>
                    </div>
                    <div className="text-gray-500 text-xs">
                        Ngày sinh: {scanResult.student.dob}
                    </div>
                </div>
            )}
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes scan {
            0% { top: 0; opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default AttendanceScanner;