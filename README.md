# 📚 Hệ Thống Quản Lý Điểm Danh Sinh Viên - CTUT

![Version](https://img.shields.io/badge/version-1.0.2-blue)
![Status](https://img.shields.io/badge/status-active-green)

## 📖 Giới Thiệu

**Hệ Thống Quản Lý Điểm Danh Sinh Viên (CTUT)** là một ứng dụng web hiện đại được phát triển cho **Trường Đại Học Kỹ Thuật - Công Nghệ Cần Thơ**, giúp đơn giản hóa quá trình quản lý điểm danh sinh viên.

### ✨ Tính Năng Chính

- 🔍 **Quét Mã QR**: Quét mã QR sinh viên để điểm danh nhanh chóng
- 📊 **Quản Lý Lớp**: Tạo, chỉnh sửa và quản lý các lớp học
- 📈 **Báo Cáo Thống Kê**: Xem chi tiết báo cáo điểm danh theo kỳ
- 📝 **Nhập Liệu Excel**: Hỗ trợ nhập danh sách lớp từ file Excel
- 👥 **Quản Lý Sinh Viên**: Thêm, sửa, xóa thông tin sinh viên
- 📋 **Quản Lý Hoạt Động**: Theo dõi các hoạt động rèn luyện của sinh viên
- ⚙️ **Cài Đặt Hệ Thống**: Tùy chỉnh các thông số hệ thống
- 🌐 **Chế Độ Khách**: Xem báo cáo công khai mà không cần đăng nhập

---

## 🚀 Hướng Dẫn Cài Đặt

### Yêu Cầu Hệ Thống

- **Node.js**: Phiên bản 14.0 hoặc cao hơn
- **npm** hoặc **yarn**: Trình quản lý gói Node.js
- **Trình duyệt**: Chrome, Firefox, Safari, Edge (phiên bản hiện đại)

### Các Bước Cài Đặt

#### 1. Sao chép Repository
```bash
git clone https://github.com/Kzi207/diemdanh-chamdrl-CTUT.git
cd diemdanh-chamdrl-CTUT
```

#### 2. Cài Đặt Các Gói Phụ Thuộc
```bash
npm install
```
hoặc
```bash
yarn install
```

#### 3. Khởi Động Máy Chủ Phát Triển
```bash
npm start
```
hoặc
```bash
npm run dev
```

Ứng dụng sẽ mở tại: **http://localhost:5173**
backend database chạy: **http://localhost:3004**      

---
### Lưu ý:niếu lỗi database vào services/storage.ts sửa link back end

---

## 📱 Hướng Dẫn Sử Dụng

### 🔐 Đăng Nhập

1. Truy cập trang chủ ứng dụng
2. Nhập **tên đăng nhập** và **mật khẩu**
3. Nhấn **"Đăng Nhập"**

> **Lưu ý**: Liên hệ quản trị viên để được cấp tài khoản đăng nhập

### 📊 Trang Bảng Điều Khiển (Dashboard)

Trang bảng điều khiển hiển thị:
- Thống kê số sinh viên
- Tỷ lệ điểm danh trong ngày
- Biểu đồ chi tiết
- Các lớp gần đây

### 🔍 Quét Mã QR - Điểm Danh Nhanh

#### Bước 1: Vào Mục "Quét Nhanh"
Chọn **"QuickScan"** từ menu chính

#### Bước 2: Chọn Lớp và Kỳ Học
- Chọn **lớp** cần điểm danh
- Chọn **kỳ học** tương ứng

#### Bước 3: Bắt Đầu Quét
- Nhấn **"Bắt Đầu Quét"**
- Cho phép truy cập camera
- Quét mã QR sinh viên

#### Bước 4: Xác Nhận
- Hệ thống sẽ hiển thị tên sinh viên
- Nhấn **"Xác Nhận"** để lưu điểm danh
- Tiếp tục quét sinh viên tiếp theo

### 👥 Quản Lý Sinh Viên

#### Xem Danh Sách Sinh Viên
1. Vào **"Quản Lý Sinh Viên"** → **"Danh Sách Sinh Viên"**
2. Tìm kiếm theo tên, MSSV hoặc lớp
3. Xem thông tin chi tiết

#### Thêm Sinh Viên Mới
1. Vào **"Quản Lý Sinh Viên"** → **"Thêm Sinh Viên"**
2. Điền thông tin:
   - Mã số sinh viên (MSSV)
   - Họ tên
   - Giới tính
   - Email
   - Số điện thoại
   - Lớp
3. Nhấn **"Lưu"**

#### Nhập Danh Sách từ Excel
1. Vào **"Quản Lý Sinh Viên"** → **"Nhập Excel"**
2. Tải file Excel mẫu (nếu cần)
3. Chọn file Excel chứa danh sách sinh viên
4. Nhấn **"Nhập"** để xử lý

> **Format Excel yêu cầu**: Cột MSSV, Tên, Giới tính, Email, Số điện thoại, Lớp

### 📚 Quản Lý Lớp

#### Tạo Lớp Mới
1. Vào **"Quản Lý Lớp"** → **"Tạo Lớp"**
2. Điền thông tin lớp:
   - Tên lớp
   - Mã lớp
   - Giảng viên chủ nhiệm
   - Năm học
3. Nhấn **"Tạo"**

#### Chỉnh Sửa Thông Tin Lớp
1. Vào **"Quản Lý Lớp"**
2. Chọn lớp cần sửa
3. Nhấn **"Chỉnh Sửa"**
4. Cập nhật thông tin
5. Nhấn **"Lưu"**

#### Xem Sinh Viên Trong Lớp
1. Vào **"Quản Lý Lớp"**
2. Chọn lớp
3. Tab **"Danh Sách Sinh Viên"** sẽ hiển thị tất cả sinh viên

### 📈 Báo Cáo Thống Kê

#### Báo Cáo Điểm Danh
1. Vào **"Báo Cáo"** → **"Điểm Danh"**
2. Chọn:
   - **Kỳ học**
   - **Lớp** (tuỳ chọn)
   - **Thời gian từ - đến**
3. Nhấn **"Xem Báo Cáo"**

#### Xuất Báo Cáo
- Nhấn **"Xuất PDF"** để tải báo cáo dạng PDF
- Nhấn **"Xuất Excel"** để tải báo cáo dạng Excel

#### Báo Cáo Chi Tiết Sinh Viên
1. Vào **"Báo Cáo"** → **"Chi Tiết Sinh Viên"**
2. Chọn sinh viên
3. Xem lịch sử điểm danh và các thông tin liên quan

### 📋 Quản Lý Hoạt Động

#### Thêm Hoạt Động Rèn Luyện
1. Vào **"Quản Lý Hoạt Động"** → **"Thêm Hoạt Động"**
2. Điền thông tin:
   - Tên hoạt động
   - Mô tả
   - Ngày tổ chức
   - Loại hoạt động
3. Nhấn **"Tạo"**

#### Quản Lý Tham Dự
1. Vào **"Quản Lý Hoạt Động"** → **"Tham Dự"**
2. Chọn hoạt động
3. Thêm/xóa sinh viên tham dự
4. Nhấn **"Lưu"**

### 🎓 Quản Lý Kỳ Học

#### Tạo Kỳ Học Mới
1. Vào **"Quản Lý Kỳ Học"** → **"Tạo Kỳ Học"**
2. Điền:
   - Tên kỳ (VD: "Kỳ I - 2024-2025")
   - Ngày bắt đầu
   - Ngày kết thúc
3. Nhấn **"Tạo"**

#### Đặt Kỳ Học Mặc Định
1. Chọn kỳ học
2. Nhấn **"Đặt Làm Mặc Định"**

### ⚙️ Cài Đặt Hệ Thống

#### Quản Trị Viên
- Quản lý tài khoản người dùng
- Cấu hình quyền truy cập
- Xem logs hoạt động

#### Tùy Chỉnh
- Thay đổi mật khẩu
- Cập nhật thông tin cá nhân
- Cài đặt thông báo

### 🌐 Chế Độ Khách (Guest View)

Cho phép xem báo cáo công khai:
1. Truy cập link chia sẻ công khai
2. Xem thống kê mà không cần đăng nhập
3. Xuất báo cáo dạng PDF

---

## 🛠️ Hướng Dẫn Phát Triển

### Cấu Trúc Thư Mục

```
/
├── pages/                    # Các trang chính
│   ├── Dashboard.tsx         # Bảng điều khiển
│   ├── QuickScan.tsx         # Quét mã QR
│   ├── ClassManagement.tsx   # Quản lý lớp
│   ├── Reports.tsx           # Báo cáo
│   ├── ActivityManager.tsx   # Quản lý hoạt động
│   ├── GradingPeriods.tsx    # Quản lý kỳ học
│   ├── Settings.tsx          # Cài đặt
│   └── Login.tsx             # Đăng nhập
├── services/                 # Các dịch vụ
│   └── storage.ts            # Quản lý lưu trữ
├── App.tsx                   # Component gốc
├── types.ts                  # Định nghĩa kiểu
├── index.tsx                 # Điểm vào
├── vite.config.ts            # Cấu hình Vite
├── tsconfig.json             # Cấu hình TypeScript
├── tailwind.config.js        # Cấu hình Tailwind CSS
└── package.json              # Dependencies
```

### Công Nghệ Sử Dụng

| Công Nghệ | Mục Đích |
|-----------|---------|
| **React 18** | Thư viện UI |
| **TypeScript** | Ngôn ngữ lập trình |
| **React Router** | Định tuyến |
| **Tailwind CSS** | Styling |
| **Vite** | Build tool |
| **jsQR** | Quét mã QR |
| **jsPDF** | Xuất PDF |
| **XLSX** | Xuất/Nhập Excel |
| **Recharts** | Biểu đồ |

### Build Ứng Dụng

```bash
npm run build
```

Tạo ra thư mục `dist/` chứa file đã tối ưu hoá

### Xem Preview

```bash
npm run preview
```

---

## 📞 Hỗ Trợ & Liên Hệ

Nếu bạn gặp vấn đề hoặc có câu hỏi:

- 📧 **Email**: 
- 🌐 **Website**: 
- 📱 **Hotline**: 

---

## 📝 Ghi Chú Quan Trọng

### Bảo Mật Dữ Liệu
- ✅ Tất cả dữ liệu được mã hoá trên máy chủ
- ✅ Chỉ quản trị viên mới có quyền truy cập toàn bộ dữ liệu
- ✅ Định kỳ sao lưu dữ liệu

### Sao Lưu & Phục Hồi
- Thực hiện sao lưu tự động hàng ngày
- Có thể phục hồi dữ liệu từ backup

### Hạn Chế Truy Cập Camera
- Cấp quyền truy cập camera chỉ khi quét mã QR
- Tự động tắt camera sau khi hoàn tất quét

---

## 📄 Giấy Phép

Copyright © 2025 

---

## 🤝 Đóng Góp

Chúng tôi hoan nghênh mọi đóng góp từ cộng đồng. Vui lòng:

1. Fork repository
2. Tạo branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Mở Pull Request

---

**Cập nhật lần cuối**: Tháng 1, 2026

Cảm ơn bạn đã sử dụng Hệ Thống Quản Lý Điểm Danh CTUT! 🎉
