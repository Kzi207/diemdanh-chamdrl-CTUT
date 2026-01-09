const http = require('http');
const fs = require('fs');
const path = require('path');

// ===== CONFIG =====
const PORT = 4000;
const API_KEY = 'kzi207-khoaktck-cncd2511'; // SECRET KEY (Must match Client)
const DATA_DIR = path.join(__dirname, "data");
const UPLOAD_DIR = path.join(DATA_DIR, "uploads"); 

// FILE TÀI KHOẢN RIÊNG BIỆT
const ACCOUNT_FILE = path.join(__dirname, "tk.json");

// Các collection dữ liệu KHÁC (vẫn lưu trong data/)
const COLLECTIONS = ['classes', 'students', 'subjects', 'activities', 'attendance', 'drl_scores', 'grading_periods'];

// Schema definitions (chỉ dùng cho data trong folder data/)
const COMPRESSION_SCHEMAS = {
    students: ['id', 'lastName', 'firstName', 'dob', 'classId'],
    attendance: ['id', 'activityId', 'studentId', 'timestamp'],
};

// ... (Helper functions) ...
function pack(name, data) {
    const keys = COMPRESSION_SCHEMAS[name];
    if (!keys || !data.length || Array.isArray(data[0])) return data;
    return data.map(item => keys.map(k => item[k]));
}

function unpack(name, data) {
    const keys = COMPRESSION_SCHEMAS[name];
    if (!keys || !data.length || !Array.isArray(data[0])) return data;
    return data.map(row => {
        const obj = {};
        keys.forEach((k, i) => obj[k] = row[i]);
        return obj;
    });
}

function initDB() {
  // 1. Init Data Directory
  if (!fs.existsSync(DATA_DIR)) {
    try { fs.mkdirSync(DATA_DIR); } catch(e) {}
  }
  if (!fs.existsSync(UPLOAD_DIR)) {
      try { fs.mkdirSync(UPLOAD_DIR); } catch(e) {}
  }

  // 2. Init Collections (non-user data)
  COLLECTIONS.forEach(col => {
    const filePath = path.join(DATA_DIR, `${col}.json`);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify([]));
    }
  });

  // 3. Init Account File (tk.json)
  if (!fs.existsSync(ACCOUNT_FILE)) {
      // Tạo tài khoản Admin mặc định nếu file chưa tồn tại
      const defaultAdmin = [{
          username: "admin",
          password: "123", // Mật khẩu mặc định
          name: "Quản Trị Viên",
          role: "admin",
          classId: ""
      }];
      fs.writeFileSync(ACCOUNT_FILE, JSON.stringify(defaultAdmin, null, 2), 'utf-8');
      console.log("Khoi tao tk.json voi tai khoan admin mac dinh (pass: 123)");
  }
}

// Hàm đọc dữ liệu (Phân luồng: users -> tk.json, còn lại -> data/*.json)
function readCollection(name) {
  try {
    if (name === 'users') {
        if (!fs.existsSync(ACCOUNT_FILE)) return [];
        const raw = fs.readFileSync(ACCOUNT_FILE, 'utf-8');
        return JSON.parse(raw);
    } else {
        const filePath = path.join(DATA_DIR, `${name}.json`);
        if (!fs.existsSync(filePath)) return [];
        const raw = fs.readFileSync(filePath, 'utf-8');
        return unpack(name, JSON.parse(raw));
    }
  } catch (e) { return []; }
}

// Hàm ghi dữ liệu
function writeCollection(name, data) {
  try {
    if (name === 'users') {
        // Ghi vào tk.json (Pretty print để dễ đọc bằng mắt)
        fs.writeFileSync(ACCOUNT_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } else {
        // Ghi vào data/*.json (Có nén pack nếu cần)
        const filePath = path.join(DATA_DIR, `${name}.json`);
        fs.writeFileSync(filePath, JSON.stringify(pack(name, data)));
    }
  } catch(e) { console.error(`Write error [${name}]:`, e); }
}

function getBaseUrl(req) {
    const protocol = req.headers['x-forwarded-proto'] ? req.headers['x-forwarded-proto'].split(',')[0] : 'http';
    const host = req.headers.host;
    return `${protocol}://${host}`;
}

// ===== SERVER =====
const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  const jsonResponse = (data, code = 200) => {
    res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(data));
  };

  const baseUrl = getBaseUrl(req) + '/';
  const parsedUrl = new URL(req.url, baseUrl);
  const endpoint = parsedUrl.pathname.split('/')[1];

  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} /${endpoint}`);

  // =======================================================
  // 0. SECURITY CHECK (API KEY FOR ALL DATABASE ACTIONS)
  // =======================================================
  const isStaticFile = (endpoint === 'uploads' || endpoint === 'img');
  const isPublicEndpoint = (endpoint === 'status');
  
  if (!isStaticFile && !isPublicEndpoint) {
      const clientKey = parsedUrl.searchParams.get('apikey');
      if (clientKey !== API_KEY) {
          console.warn(`[AUTH FAIL] IP: ${req.socket.remoteAddress} | Request: /${endpoint} | Key: ${clientKey}`);
          return jsonResponse({ error: "Unauthorized: Invalid API Key" }, 403);
      }
  }

  // =======================================================
  // STATIC FILES
  // =======================================================
  if (isStaticFile && req.method === 'GET') {
      let filename = parsedUrl.pathname.replace(/^\/(uploads|img)\//, '');
      try { filename = decodeURIComponent(filename); } catch (e) {}
      const filePath = path.join(UPLOAD_DIR, filename);
      if (fs.existsSync(filePath) && fs.lstatSync(filePath).isFile()) {
          const ext = path.extname(filePath).toLowerCase();
          const mime = { '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg' }[ext] || 'application/octet-stream';
          res.writeHead(200, { 'Content-Type': mime, 'Access-Control-Allow-Origin': '*' });
          fs.createReadStream(filePath).pipe(res);
          return;
      } else {
          res.writeHead(404); res.end("Not found"); return;
      }
  }

  const readBody = () => new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => { try { resolve(body ? JSON.parse(body) : {}); } catch (e) { resolve({}); } });
  });

  // =======================================================
  // UTILS & UPLOAD
  // =======================================================
  
  if (endpoint === 'delimg' && req.method === 'GET') {
      const { tk_sv, muc_danh_gia } = Object.fromEntries(parsedUrl.searchParams);
      if (!tk_sv || !muc_danh_gia) return jsonResponse({ error: "Thieu thong tin" }, 400);
      
      const safeId = String(tk_sv).replace(/[^a-zA-Z0-9]/g, '');
      const safeCat = String(muc_danh_gia).replace(/\./g, '-').replace(/[^a-zA-Z0-9\-]/g, '');
      const prefix = `${safeId}_${safeCat}_`;
      
      try {
          const files = fs.readdirSync(UPLOAD_DIR);
          files.filter(f => f.startsWith(prefix)).forEach(f => fs.unlinkSync(path.join(UPLOAD_DIR, f)));
          return jsonResponse({ success: true });
      } catch(e) { return jsonResponse({ error: "Loi server" }, 500); }
  }

  if (endpoint === 'api' && parsedUrl.pathname === '/api/get-proof' && req.method === 'GET') {
      const { tk_sv, muc_danh_gia } = Object.fromEntries(parsedUrl.searchParams);
      if (!tk_sv || !muc_danh_gia) return jsonResponse({ error: "Thieu thong tin" }, 400);
      
      const safeCat = muc_danh_gia.replace(/\./g, '-');
      const prefix = `${tk_sv}_${safeCat}_`;
      
      try {
          const files = fs.readdirSync(UPLOAD_DIR);
          const match = files.filter(f => f.startsWith(prefix)).sort().reverse()[0];
          if (!match) return jsonResponse({ error: "Not found" }, 404);
          return jsonResponse({ url_anh: `${getBaseUrl(req)}/img/${match}` });
      } catch (e) { return jsonResponse({ error: "Server error" }, 500); }
  }

  if (endpoint === 'upload' && req.method === 'POST') {
      readBody().then(payload => {
          try {
              const { fileName, fileData, studentId, category } = payload;
              if (!fileName || !fileData) throw new Error("Missing data");
              const buffer = Buffer.from(fileData.replace(/^data:image\/\w+;base64,/, ""), 'base64');
              
              let uniqueName;
              const ext = path.extname(fileName);
              if (studentId && category) {
                  const safeId = String(studentId).replace(/[^a-zA-Z0-9]/g, '');
                  const safeCat = String(category).replace(/\./g, '-').replace(/[^a-zA-Z0-9\-]/g, '');
                  uniqueName = `${safeId}_${safeCat}_${Date.now()}${ext}`;
              } else {
                  uniqueName = `${Date.now()}_${path.basename(fileName, ext)}${ext}`;
              }

              fs.writeFileSync(path.join(UPLOAD_DIR, uniqueName), buffer);
              const url = `${getBaseUrl(req)}/img/${uniqueName}`;
              jsonResponse({ success: true, url, url_anh: url });
          } catch(e) { jsonResponse({ error: e.message }, 500); }
      });
      return;
  }

  // =======================================================
  // DATA OPERATIONS
  // =======================================================

  if (endpoint === 'status') return jsonResponse({ status: 'ok', mode: 'Secure NodeJS' });

  if (endpoint === 'change-password' && req.method === 'POST') {
      readBody().then(({ username, newPassword }) => {
          const list = readCollection('users');
          const idx = list.findIndex(u => u.username === username);
          if (idx !== -1) {
              list[idx].password = newPassword;
              writeCollection('users', list);
              jsonResponse({ success: true });
          } else { jsonResponse({ error: 'Not found' }, 404); }
      });
      return;
  }

  // NEW: Force Reset Passwords for Batch (Update existing users)
  if (endpoint === 'users-reset-pass' && req.method === 'POST') {
      readBody().then(updates => { // updates: [{username, password}, ...]
          const list = readCollection('users');
          let count = 0;
          updates.forEach(upd => {
              // Case insensitive username matching
              const idx = list.findIndex(u => u.username.toLowerCase() === upd.username.toLowerCase());
              if (idx !== -1) {
                  list[idx].password = upd.password;
                  count++;
              }
          });
          if(count > 0) writeCollection('users', list);
          jsonResponse({ success: true, count });
      });
      return;
  }

  if (endpoint === 'users-batch' && req.method === 'POST') {
      readBody().then(users => {
          const list = readCollection('users');
          const existing = new Set(list.map(u => u.username));
          let count = 0;
          users.forEach(u => {
              if (!existing.has(u.username)) {
                  list.push(u);
                  existing.add(u.username);
                  count++;
              }
          });
          if(count > 0) writeCollection('users', list);
          jsonResponse({ success: true, count });
      });
      return;
  }

  // GENERIC HANDLER FOR COLLECTIONS + USERS
  if (COLLECTIONS.includes(endpoint) || endpoint === 'users') {
      if (req.method === 'GET') {
          const list = readCollection(endpoint);
          // Simple Filters
          if (endpoint === 'students') {
              const cid = parsedUrl.searchParams.get('classId');
              if (cid) return jsonResponse(list.filter(s => String(s.classId) === String(cid)));
          }
          if (endpoint === 'attendance') {
              const aid = parsedUrl.searchParams.get('activityId');
              if (aid) return jsonResponse(list.filter(a => String(a.activityId) === String(aid)));
          }
          return jsonResponse(list);
      }
      
      if (req.method === 'POST') {
          readBody().then(item => {
              const list = readCollection(endpoint);
              // Simple Upsert for DRL Scores
              if (endpoint === 'drl_scores') {
                  const idx = list.findIndex(s => s.id === item.id);
                  if (idx !== -1) list[idx] = item;
                  else list.push(item);
              } 
              // Deduplication for attendance
              else if (endpoint === 'attendance') {
                  const exists = list.some(a => a.activityId === item.activityId && a.studentId === item.studentId);
                  if(!exists) list.push(item);
              } 
              // Users (Manual create)
              else if (endpoint === 'users') {
                 // Check duplicate username
                 const exists = list.some(u => u.username === item.username);
                 if (exists) {
                    return jsonResponse({ error: "Username exists" }, 400);
                 }
                 list.push(item);
              }
              // Generic Append
              else {
                  if (Array.isArray(item)) list.push(...item); // handle importStudents
                  else list.push(item);
              }
              writeCollection(endpoint, list);
              jsonResponse({ success: true });
          });
          return;
      }
      
      if (req.method === 'PUT') {
          readBody().then(item => {
              const list = readCollection(endpoint);
              const key = endpoint === 'users' ? 'username' : 'id';
              const idx = list.findIndex(i => String(i[key]) === String(item[key]));
              if (idx !== -1) {
                  list[idx] = { ...list[idx], ...item };
                  writeCollection(endpoint, list);
              }
              jsonResponse({ success: true });
          });
          return;
      }

      if (req.method === 'DELETE') {
          readBody().then(payload => {
              const list = readCollection(endpoint);
              const key = endpoint === 'users' ? 'username' : 'id';
              const val = payload[key];
              const newList = list.filter(i => String(i[key]) !== String(val));
              writeCollection(endpoint, newList);
              jsonResponse({ success: true });
          });
          return;
      }
  }

  if (!res.writableEnded) jsonResponse({ error: 'Not Found' }, 404);
});

// Error handling
server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') console.error('Port 4000 busy. Run: npx kill-port 4000');
  else console.error(e);
});

initDB();
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`- Tai khoan luu tai: ${ACCOUNT_FILE}`);
  console.log(`- Du lieu khac luu tai: ${DATA_DIR}`);
});