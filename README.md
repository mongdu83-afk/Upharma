# Sổ khách hàng — CRM cho team nhỏ

Ứng dụng web quản lý khách hàng, cơ hội bán hàng (pipeline) và công việc cần làm.
Dữ liệu lưu trên Supabase (Postgres, miễn phí) và dùng chung cho cả team — mọi
người mở link sẽ thấy cùng một dữ liệu, cập nhật gần như tức thời.

Chi phí: **0 đồng** với gói miễn phí của Supabase và Vercel (đủ dùng cho team nhỏ).

---

## Bước 1 — Tạo database trên Supabase

1. Vào https://supabase.com → **Start your project** → đăng nhập bằng GitHub/Google.
2. **New project**: đặt tên (vd `so-khach-hang`), đặt mật khẩu database, chọn khu vực
   gần bạn nhất (vd Singapore), bấm **Create new project**. Đợi khoảng 1-2 phút.
3. Vào menu bên trái → **SQL Editor** → **New query**.
4. Mở file `supabase-schema.sql` trong thư mục này, copy toàn bộ nội dung, dán vào
   ô query rồi bấm **Run**. Lệnh này tạo 3 bảng (`contacts`, `deals`, `tasks`) và
   bật tính năng đồng bộ realtime.
5. Vào menu **Project Settings** (biểu tượng bánh răng) → **Data API**. Ghi lại:
   - **Project URL** (dạng `https://xxxx.supabase.co`)
   - **anon public key** (chuỗi dài bắt đầu `eyJ...`)

> Lưu ý bảo mật: cấu hình mặc định cho phép bất kỳ ai có 2 giá trị trên đều đọc/ghi
> được dữ liệu — phù hợp cho team nội bộ chia sẻ nội bộ. Nếu app sẽ public rộng rãi,
> nên bật Supabase Auth (đăng nhập bằng email) và sửa lại policy trong file SQL.

## Bước 2 — Chạy thử trên máy (không bắt buộc)

```bash
npm install
cp .env.example .env.local
# mở .env.local, dán Project URL và anon key vào
npm run dev
```

Mở http://localhost:5173 để xem thử.

## Bước 3 — Đưa code lên GitHub

```bash
git init
git add .
git commit -m "Khởi tạo CRM"
```

Tạo một repo mới trên https://github.com/new (để **Private** nếu muốn), rồi:

```bash
git remote add origin https://github.com/<ten-cua-ban>/so-khach-hang.git
git branch -M main
git push -u origin main
```

## Bước 4 — Deploy lên Vercel (miễn phí)

1. Vào https://vercel.com → đăng nhập bằng GitHub.
2. **Add New** → **Project** → chọn repo `so-khach-hang` vừa tạo → **Import**.
3. Ở mục **Environment Variables**, thêm 2 biến:
   - `VITE_SUPABASE_URL` = Project URL đã lấy ở Bước 1
   - `VITE_SUPABASE_ANON_KEY` = anon public key đã lấy ở Bước 1
4. Bấm **Deploy**. Sau khoảng 1 phút, Vercel cho bạn một link dạng
   `https://so-khach-hang.vercel.app` — gửi link này cho cả team dùng chung.

Từ lần sau, mỗi khi bạn `git push`, Vercel tự động deploy bản mới.

## Cấu trúc thư mục

```
src/
  App.jsx            giao diện và toàn bộ logic ứng dụng
  supabaseClient.js   kết nối tới Supabase
  main.jsx / index.css
supabase-schema.sql   lệnh SQL tạo bảng, chạy 1 lần trên Supabase
.env.example           mẫu biến môi trường
```

## Mở rộng thêm

- **Đăng nhập từng người**: thêm Supabase Auth (email/mật khẩu hoặc Google) để
  biết chính xác ai tạo/sửa dữ liệu, thay vì chỉ lưu tên trên trình duyệt.
- **Phân quyền**: giới hạn ai được xóa dữ liệu bằng RLS policy theo `auth.uid()`.
- **Xuất báo cáo**: thêm nút xuất Excel/CSV từ bảng khách hàng hoặc cơ hội.
- **Tên miền riêng**: trong Vercel → Project → Settings → Domains, gắn tên miền
  của công ty thay vì dùng `*.vercel.app`.
