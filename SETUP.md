# Hướng dẫn cài đặt nhanh WordForge AI

## 🚀 Cài đặt và chạy trong 5 phút

### Bước 1: Cài đặt dependencies
```bash
npm install
```

### Bước 2: Cấu hình database
Tạo file `.env.local` với nội dung:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/wordforge_ai?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"
OPENAI_API_KEY="your-openai-api-key"
```

### Bước 3: Thiết lập database
```bash
npm run db:push
npm run db:generate
```

### Bước 4: Chạy ứng dụng
```bash
npm run dev
```

Truy cập: http://localhost:3000

## 🔧 Các lệnh hữu ích

- `npm run dev` - Chạy development server
- `npm run build` - Build production
- `npm run db:studio` - Mở Prisma Studio
- `npm run db:migrate` - Tạo migration mới
- `npm run lint` - Kiểm tra lỗi code

## 📝 Lưu ý

- Cần có PostgreSQL database đang chạy
- Cần API key từ OpenAI để tạo flashcard
- Có thể bỏ qua Google OAuth nếu chỉ test local
