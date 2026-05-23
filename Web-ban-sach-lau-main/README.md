<div align="center">

# 📚 BookHaven

**Hệ thống thương mại điện tử sách trực tuyến toàn diện**

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com/)
[![Vite](https://img.shields.io/badge/Vite-Build_Tool-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)

</div>

---

## 📖 Giới thiệu

**BookHaven** là một nền tảng thương mại điện tử chuyên biệt dành cho việc kinh doanh sách trực tuyến, được xây dựng với kiến trúc Frontend và Backend tách rời hoàn toàn (**Decoupled Architecture**).

Hệ thống bao gồm:
- 🛍️ **Cửa hàng trực tuyến** dành cho khách hàng với trải nghiệm mua sắm hiện đại.
- ⚙️ **Trang quản trị nội bộ** (WebAdmin) với hệ thống phân quyền đa vai trò (RBAC).
- 🔌 **RESTful API Backend** cung cấp dữ liệu cho toàn hệ thống.

---

## 🏗️ Kiến trúc hệ thống

```
BookHaven/
├── WebClient/          # Giao diện khách hàng (React + Vite)
├── WebAdmin/           # Trang quản trị nội bộ (React + Vite)
├── Backend/            # API Server (Node.js + Express)
└── init_supabase_db.sql  # Schema khởi tạo cơ sở dữ liệu
```

---

## ✨ Tính năng nổi bật

### 🛍️ WebClient — Cửa hàng khách hàng
| Tính năng | Mô tả |
|---|---|
| Trang chủ & Tìm kiếm | Duyệt sách theo danh mục, tìm kiếm nhanh |
| Trang chi tiết sách | Thông tin đầy đủ: tác giả, NXB, số trang, đánh giá |
| Giỏ hàng & Checkout | Đặt hàng với mã giảm giá, chọn địa chỉ giao hàng |
| Tài khoản cá nhân | Lịch sử đơn hàng, quản lý địa chỉ, hồ sơ cá nhân |
| Danh sách Yêu thích | Lưu sách yêu thích để mua sau |
| Chat CSKH | Hỗ trợ trực tiếp với đội ngũ CSKH qua Floating Chat |
| Đánh giá sách | Hệ thống Review & Rating theo sao |

### ⚙️ WebAdmin — Trang quản trị (RBAC)

Hệ thống **phân quyền theo vai trò** chi tiết:

| Vai trò | Quyền truy cập |
|---|---|
| 👑 **Admin** | Toàn quyền — Khách hàng, Sách, Đơn hàng, Danh mục, Mã giảm giá, CSKH Chat |
| 📦 **Seller** | Quản lý Sách, Danh mục và Đơn hàng |
| 💬 **CSKH** | Xem Đơn hàng và xử lý Chat hỗ trợ |
| 🚚 **Shipper** | Chỉ truy cập Shipper Portal để cập nhật trạng thái giao hàng |
| 🙅 **Customer** | Không có quyền truy cập WebAdmin |

### 🔌 Backend — API Server

- **15 nhóm endpoint** bao gồm: Auth, Products, Orders, Cart, Checkout, Reviews, Chat, Shipper, Admin, Vouchers, Upload...
- Xác thực bằng **JWT Token** qua `authMiddleware`.
- Mã hóa mật khẩu bằng **bcryptjs**.
- Tích hợp **Supabase Storage** cho upload và quản lý hình ảnh.

---

## 🛠️ Tech Stack

| Lớp | Công nghệ |
|---|---|
| **Frontend** | React 18, Vite, React Router DOM, Lucide React |
| **Backend** | Node.js, Express.js, Nodemon, bcryptjs, jsonwebtoken |
| **Database** | Supabase (PostgreSQL) |
| **Storage** | Supabase Storage |
| **UI** | Vanilla CSS, Custom Design System |

---

## 🚀 Hướng dẫn cài đặt

### Yêu cầu hệ thống
- Node.js >= 18.x
- npm >= 9.x
- Tài khoản [Supabase](https://supabase.com/)

### Bước 1 — Khởi tạo cơ sở dữ liệu

Đăng nhập vào **Supabase Dashboard** và chạy toàn bộ nội dung file `init_supabase_db.sql` trong phần **SQL Editor**.

### Bước 2 — Cài đặt & chạy Backend

```bash
cd Backend
npm install
```

Tạo file `.env` trong thư mục `Backend/`:
```env
PORT=5000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-anon-key
SUPABASE_IMAGE_BASE=https://your-project.supabase.co/storage/v1/object/public/images/
JWT_SECRET=your-random-secret-key
```

Khởi động server:
```bash
npm run dev
# Server chạy tại http://localhost:5000
```

### Bước 3 — Cài đặt & chạy WebAdmin

```bash
cd WebAdmin
npm install
npm run dev
# Chạy tại http://localhost:5174 (hoặc port Vite tự phân)
```

### Bước 4 — Cài đặt & chạy WebClient

```bash
cd WebClient
npm install
npm run dev
# Chạy tại http://localhost:5173 (hoặc port Vite tự phân)
```

---

## 🗃️ Cấu trúc Database

Các bảng chính trong hệ thống:

```
users              → Tài khoản (admin, seller, cskh, shipper, customer)
products           → Thông tin sách
product_variants   → Biến thể sách (bìa mềm, bìa cứng, tái bản...)
categories         → Danh mục sách (có hỗ trợ Parent/Child)
orders             → Đơn hàng
order_items        → Chi tiết sản phẩm trong đơn
vouchers           → Mã giảm giá
reviews            → Đánh giá & xếp hạng sao
cart_items         → Giỏ hàng tạm
favorites          → Danh sách yêu thích
addresses          → Địa chỉ giao hàng
chat_sessions      → Phiên hỗ trợ CSKH
chat_messages      → Tin nhắn trong phiên chat
```

---

## 📁 Cấu trúc thư mục chi tiết

<details>
<summary><b>Backend/</b></summary>

```
Backend/
├── server.js
└── src/
    ├── config/
    │   ├── constants.js
    │   └── supabase.js
    ├── helpers/
    │   └── imageMapper.js
    ├── middlewares/
    │   └── auth.js
    └── routes/
        ├── admin.js       # Dashboard, Users, Orders (Admin)
        ├── auth.js        # Đăng ký, Đăng nhập
        ├── cart.js        # Giỏ hàng
        ├── chat.js        # Chat CSKH
        ├── checkout.js    # Thanh toán & Tạo đơn
        ├── home.js        # Dữ liệu trang chủ
        ├── orders.js      # Lịch sử đơn hàng (User)
        ├── products.js    # Danh sách & Chi tiết sách
        ├── reviews.js     # Đánh giá sản phẩm
        ├── shipper.js     # Cổng Shipper
        ├── upload.js      # Upload ảnh
        ├── user.js        # Hồ sơ người dùng
        └── vouchers.js    # Mã giảm giá
```
</details>

<details>
<summary><b>WebClient/</b></summary>

```
WebClient/src/
├── api/client.js
├── context/          # AuthContext, CartContext
├── components/       # Navbar, Footer, FloatingChat, Toast...
└── pages/
    ├── StoreHome.jsx
    ├── ProductDetail.jsx
    ├── Cart.jsx
    ├── Checkout.jsx
    ├── OrderHistory.jsx
    ├── Profile.jsx
    └── ...
```
</details>

<details>
<summary><b>WebAdmin/</b></summary>

```
WebAdmin/src/
├── context/AuthContext.jsx
├── components/Sidebar.jsx
└── pages/
    ├── Login.jsx
    ├── Dashboard.jsx
    ├── Products.jsx
    ├── Orders.jsx
    ├── Categories.jsx
    ├── Vouchers.jsx
    ├── Users.jsx
    ├── ChatSupport.jsx
    └── ShipperPortal.jsx
```
</details>

---

<div align="center">

Made with ❤️ by **BookHaven (Nhóm X) Team**

</div>
