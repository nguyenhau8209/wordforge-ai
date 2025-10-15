# WordForge AI - Ứng dụng học từ vựng thông minh

WordForge AI là một ứng dụng web học từ vựng thông minh được xây dựng với Next.js, sử dụng AI để tự động tạo flashcard và hệ thống lặp lại ngắt quãng (SRS) để tối ưu hóa quá trình học.

## ✨ Tính năng chính

- 🤖 **AI Flashcard Forge**: Tự động tạo flashcard với định nghĩa, phát âm, câu ví dụ và hình ảnh
- 📚 **Hệ thống SRS**: Lên lịch ôn tập thông minh dựa trên thuật toán SuperMemo
- 🎯 **Luyện tập tương tác**: Các bài quiz đa dạng để củng cố kiến thức
- 📊 **Dashboard tiến độ**: Thống kê trực quan về quá trình học
- 🔐 **Xác thực an toàn**: Đăng nhập với Google OAuth

## 🛠️ Công nghệ sử dụng

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Styling**: Tailwind CSS, Shadcn/ui
- **Backend**: Next.js API Routes, Server Actions
- **Database**: PostgreSQL với Prisma ORM
- **Authentication**: NextAuth.js
- **AI Integration**: OpenAI API, Google TTS, DALL-E

## 🚀 Cài đặt và chạy dự án

### Yêu cầu hệ thống

- Node.js 18+ 
- PostgreSQL database
- Tài khoản OpenAI API
- Tài khoản Google OAuth (tùy chọn)

### Bước 1: Clone repository

```bash
git clone <repository-url>
cd wordforge-ai
```

### Bước 2: Cài đặt dependencies

```bash
npm install
```

### Bước 3: Cấu hình biến môi trường

Tạo file `.env.local` trong thư mục gốc:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/wordforge_ai?schema=public"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# OAuth Providers
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# AI APIs
OPENAI_API_KEY="your-openai-api-key"
GOOGLE_TTS_API_KEY="your-google-tts-api-key"
DALL_E_API_KEY="your-dalle-api-key"
```

### Bước 4: Thiết lập database

```bash
# Tạo migration
npx prisma migrate dev

# Generate Prisma client
npx prisma generate
```

### Bước 5: Chạy ứng dụng

```bash
npm run dev
```

Truy cập [http://localhost:3000](http://localhost:3000) để xem ứng dụng.

## 📁 Cấu trúc dự án

```
wordforge-ai/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API Routes
│   │   ├── auth/              # Authentication pages
│   │   ├── dashboard/         # Dashboard page
│   │   ├── practice/          # Practice pages
│   │   └── page.tsx           # Home page
│   ├── components/            # React components
│   │   └── ui/               # Shadcn/ui components
│   └── lib/                  # Utility functions
│       ├── auth.ts           # NextAuth configuration
│       └── prisma.ts         # Prisma client
├── prisma/
│   └── schema.prisma         # Database schema
└── public/                   # Static assets
```

## 🎯 Các tính năng đã triển khai

### ✅ MVP (Giai đoạn 1)
- [x] Khởi tạo dự án Next.js với App Router
- [x] Cấu hình Tailwind CSS và Shadcn/ui
- [x] Thiết lập Prisma ORM và database schema
- [x] Cài đặt NextAuth.js cho xác thực
- [x] Tạo API routes cho AI integration
- [x] Xây dựng giao diện cơ bản cho flashcard
- [x] Implement hệ thống SRS cơ bản

### 🔄 Đang phát triển (Giai đoạn 2)
- [ ] Trang Dashboard cá nhân hoàn chỉnh
- [ ] Các trang luyện tập và kiểm tra nâng cao
- [ ] Hoàn thiện UI/UX và responsive design
- [ ] Tích hợp audio phát âm thực tế
- [ ] Tích hợp hình ảnh từ DALL-E

### 📋 Kế hoạch (Giai đoạn 3)
- [ ] Tối ưu hiệu suất và tốc độ tải
- [ ] Tính năng tạo nhiều bộ từ vựng
- [ ] Báo cáo tiến độ chi tiết
- [ ] Chia sẻ bộ từ vựng với cộng đồng
- [ ] Mobile app (React Native)

## 🤝 Đóng góp

Mọi đóng góp đều được chào đón! Vui lòng:

1. Fork dự án
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Mở Pull Request

## 📄 License

Dự án này được phân phối dưới MIT License. Xem file `LICENSE` để biết thêm thông tin.

## 📞 Liên hệ

Nếu có câu hỏi hoặc góp ý, vui lòng tạo issue trên GitHub hoặc liên hệ qua email.

---

**WordForge AI** - Học từ vựng thông minh, hiệu quả hơn! 🚀