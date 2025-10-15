# Hướng Dẫn Cấu Hình Google Gemini API

## Bước 1: Tạo API Key cho Google Gemini

1. Truy cập [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Đăng nhập bằng tài khoản Google của bạn
3. Nhấn "Create API Key"
4. Sao chép API key được tạo

## Bước 2: Cấu Hình Environment Variables

Tạo file `.env.local` trong thư mục gốc của dự án và thêm:

```env
# Google Gemini AI
GOOGLE_GEMINI_API_KEY="your-gemini-api-key-here"
```

## Bước 3: Khởi Động Ứng Dụng

```bash
npm run dev
```

## Lưu Ý Quan Trọng

- API key của Google Gemini có giới hạn sử dụng miễn phí
- Đảm bảo không commit file `.env.local` vào Git
- Nếu gặp lỗi "API key not configured", kiểm tra lại file `.env.local`
- Ứng dụng sử dụng model `gemini-pro` của Google AI

## Tính Năng Đã Triển Khai

✅ **Tạo từ vựng theo chủ đề**: Sử dụng Gemini API để tạo danh sách từ vựng
✅ **Bài đọc ngữ cảnh**: Tạo đoạn văn sử dụng các từ vựng đã học
✅ **Bài luyện tập đa dạng**: 3 dạng bài tập (điền từ, nối từ, trắc nghiệm)
✅ **Luyện nghe**: Text-to-Speech tích hợp sẵn trong trình duyệt
✅ **Luyện nói**: Ghi âm và phát lại giọng nói
✅ **Giao diện thân thiện**: Progress bar và navigation rõ ràng

## Cách Sử Dụng

1. Đăng nhập vào ứng dụng
2. Nhấn nút "Tạo Bài Học Hôm Nay"
3. Nhập chủ đề muốn học (ví dụ: "Công nghệ xanh")
4. Chọn số lượng từ vựng (10-30 từ)
5. Làm theo 4 bước: Từ vựng → Đọc hiểu → Luyện tập → Nghe & Nói
