import { Student, ClassGroup, Activity, AttendanceRecord, User, Subject, DRLScore, GradingPeriod } from '../types';

// CONFIG KEYS
const KEYS = {
  API_URL: 'kzi_api_url',
  SESSION: 'kzi_session'
};

// SECRET API KEY (UPDATED)
const API_KEY = 'kzi207-khoaktck-cncd2511';

// --- CONFIGURATION ---

export const getApiUrl = () => {
  let saved = localStorage.getItem(KEYS.API_URL);
  
  if (saved) {
      if (!saved.startsWith('http')) return `http://${saved}`;
      return saved.endsWith('/') ? saved.slice(0, -1) : saved;
  }

  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:4000';
  }

  return 'https://database.kzii.site';
};

export const saveApiConfig = (url: string) => {
  localStorage.setItem(KEYS.API_URL, url.replace(/\/$/, ''));
};

export const resetApiConfig = () => { localStorage.removeItem(KEYS.API_URL); };

// --- REST CLIENT ---

const fetchAPI = async (endpoint: string, method: string = 'GET', body?: any) => {
  const baseUrl = getApiUrl();
  
  try {
    const options: RequestInit = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    if (body) options.body = JSON.stringify(body);

    const separator = endpoint.includes('?') ? '&' : '?';
    const finalUrl = `${baseUrl}/${endpoint}${separator}apikey=${API_KEY}`;

    const res = await fetch(finalUrl, options);
    
    if (!res.ok) {
        if (res.status === 403) {
            throw new Error("Lỗi xác thực (403): API Key không khớp với Server.");
        }
        throw new Error(`Lỗi Server: ${res.status} ${res.statusText}`);
    }
    return await res.json();
  } catch (e: any) {
    console.error(`API Call Failed [${endpoint}]:`, e);
    if (e.name === 'TypeError' && (e.message === 'Failed to fetch' || e.message.includes('NetworkError'))) {
         throw new Error(`Không thể kết nối Server (${baseUrl}). Vui lòng kiểm tra file server.js đã chạy chưa.`);
    }
    throw e;
  }
};

// --- EXPORTS ---

export const checkSystemStatus = async (): Promise<{ status: string, message: string }> => {
  try {
    const res = await fetchAPI('status');
    return { status: 'ok', message: `Kết nối ổn định: ${res.mode || 'Server'}` };
  } catch (e: any) {
    return { status: 'error', message: 'Mất kết nối Server.' };
  }
};

export const getUsers = async (): Promise<User[]> => fetchAPI('users');
export const createUser = async (user: User): Promise<void> => fetchAPI('users', 'POST', user);
export const createUsersBatch = async (users: User[]): Promise<{ count: number }> => fetchAPI('users-batch', 'POST', users);
export const resetUsersBatch = async (users: User[]): Promise<{ count: number }> => fetchAPI('users-reset-pass', 'POST', users);
export const changePassword = async (username: string, newPassword: string): Promise<void> => fetchAPI('change-password', 'POST', { username, newPassword });
export const updateUser = async (user: User): Promise<void> => fetchAPI('users', 'PUT', user);
export const deleteUser = async (username: string): Promise<void> => fetchAPI('users', 'DELETE', { username });

export const login = async (username: string, password: string): Promise<{ success: boolean, message?: string }> => {
  // Local admin backdoor
  if (username === 'admin' && password === 'admin123') {
    const adminUser: User = { username: 'admin', password: '', name: 'Super Admin', role: 'admin' };
    localStorage.setItem(KEYS.SESSION, JSON.stringify(adminUser));
    return { success: true };
  }
  
  try {
      const users = await getUsers();
      
      if (!users || users.length === 0) {
          return { success: false, message: "Hệ thống chưa có dữ liệu tài khoản nào." };
      }

      // Normalize inputs
      const inputUser = username.trim().toLowerCase();
      const inputPass = password.trim();

      // Case-insensitive username match
      const user = users.find(u => u.username.toLowerCase().trim() === inputUser);
      
      if (user) {
          // Strict password check (but trim spaces)
          if (String(user.password).trim() === inputPass) {
              localStorage.setItem(KEYS.SESSION, JSON.stringify(user));
              return { success: true };
          } else {
              // DEBUG: Log password mismatch (Remove in production)
              console.warn(`Login Failed for ${user.username}. Expected length: ${user.password.length}, Got: ${inputPass.length}`);
              return { success: false, message: "Sai mật khẩu!" };
          }
      } else {
          return { success: false, message: "Tên đăng nhập không tồn tại!" };
      }
  } catch (e: any) {
      throw e; 
  }
};

export const isLoggedIn = () => !!localStorage.getItem(KEYS.SESSION);
export const logout = () => localStorage.removeItem(KEYS.SESSION);
export const getCurrentUser = (): User | null => JSON.parse(localStorage.getItem(KEYS.SESSION) || 'null');

export const getClasses = async (): Promise<ClassGroup[]> => fetchAPI('classes');
export const createClass = async (cls: ClassGroup): Promise<void> => fetchAPI('classes', 'POST', cls);
export const updateClass = async (id: string, name: string): Promise<void> => fetchAPI('classes', 'PUT', { id, name });
export const deleteClass = async (id: string): Promise<void> => fetchAPI('classes', 'DELETE', { id });

export const getSubjects = async (): Promise<Subject[]> => fetchAPI('subjects');
export const createSubject = async (sub: Subject): Promise<void> => fetchAPI('subjects', 'POST', sub);

export const getActivities = async (): Promise<Activity[]> => fetchAPI('activities');
export const createActivity = async (act: Activity): Promise<void> => fetchAPI('activities', 'POST', act);

export const getStudents = async (classId?: string): Promise<Student[]> => {
    const query = classId ? `?classId=${classId}` : '';
    return fetchAPI(`students${query}`);
};
export const importStudents = async (students: Student[]): Promise<void> => fetchAPI('students', 'POST', students);

export const getAttendance = async (activityId?: string): Promise<AttendanceRecord[]> => {
    const query = activityId ? `?activityId=${activityId}` : '';
    return fetchAPI(`attendance${query}`);
};

export const markAttendance = async (activityId: string, studentId: string): Promise<{ status: string, student?: Student }> => {
    try {
        const allStudents = await getStudents(); 
        const student = allStudents.find(s => s.id === studentId);
        if (!student) return { status: 'student_not_found' };

        const attendance = await getAttendance(activityId);
        const exists = attendance.some(a => a.studentId === studentId);
        if (exists) return { status: 'already_present', student };

        const record: AttendanceRecord = {
            id: Date.now().toString(),
            activityId,
            studentId,
            timestamp: new Date().toISOString()
        };
        await fetchAPI('attendance', 'POST', record);
        return { status: 'success', student };
    } catch (e) {
        console.error(e);
        return { status: 'error' };
    }
};

export const getDRLScores = async (): Promise<DRLScore[]> => fetchAPI('drl_scores');
export const saveDRLScore = async (score: DRLScore): Promise<void> => fetchAPI('drl_scores', 'POST', score);

export const getGradingPeriods = async (): Promise<GradingPeriod[]> => fetchAPI('grading_periods');
export const createGradingPeriod = async (period: GradingPeriod): Promise<void> => fetchAPI('grading_periods', 'POST', period);
export const updateGradingPeriod = async (period: GradingPeriod): Promise<void> => fetchAPI('grading_periods', 'PUT', period);
export const deleteGradingPeriod = async (id: string): Promise<void> => fetchAPI('grading_periods', 'DELETE', { id });

export const uploadProofImage = async (file: File, studentId?: string, category?: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
            try {
                const base64Str = reader.result as string;
                const res = await fetchAPI('upload', 'POST', { 
                    fileName: file.name, 
                    fileData: base64Str,
                    studentId,
                    category 
                });
                if (res.success && (res.url_anh || res.url)) {
                    resolve(res.url_anh || res.url);
                } else {
                    reject(new Error(res.error || 'Upload failed'));
                }
            } catch (e) { reject(e); }
        };
        reader.onerror = error => reject(error);
    });
};

export const getProofImageViaAPI = async (studentId: string, criteriaId: string): Promise<string | null> => {
    try {
        const res = await fetchAPI(`api/get-proof?tk_sv=${studentId}&muc_danh_gia=${criteriaId}`);
        return res.url_anh || null;
    } catch (e) {
        return null;
    }
};

export const deleteProofImage = async (studentId: string, criteriaId: string) => {
    return fetchAPI(`delimg?tk_sv=${studentId}&muc_danh_gia=${criteriaId}`, 'GET');
};

export const getStorageMode = () => 'server';
export const setStorageMode = () => {};
export const setOfflineMode = () => {};
export const isOfflineMode = () => false;
export const getSupabaseUrl = () => "";
export const saveSupabaseConfig = () => {};
export const resetSupabaseClient = () => {};
export const exportDatabase = async () => "{}";
export const importDatabase = () => false;
export const getApiKey = () => "";