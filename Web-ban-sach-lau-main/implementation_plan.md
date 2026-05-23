# Kế hoạch Nâng cấp Giao diện Trang chủ (WOW Factor)

Bản kế hoạch này nhằm lột xác hoàn toàn trang chủ `StoreHome.jsx`, biến nó từ một giao diện tĩnh cơ bản thành một trải nghiệm thương mại điện tử cao cấp, sống động và hiện đại.

> [!WARNING]
> **User Review Required**
> Quá trình này sẽ thay đổi lớn về mặt thị giác của trang chủ. Vui lòng xem kỹ các đề xuất bên dưới và cho tôi biết bạn muốn triển khai toàn bộ hay chỉ một số phần cụ thể?

## Phân tích Tình trạng Hiện tại
- **Công nghệ:** Đang lạm dụng Inline Styles (CSS viết trong JS bằng Object). Rất khó bảo trì và không hỗ trợ hiệu ứng `:hover` phức tạp.
- **Thị giác:** Phẳng, tĩnh, thiếu điểm nhấn, chưa có chiều sâu không gian.

## Đề xuất Các Yếu tố "WOW" (WOW Factors)

### 1. Chuyển đổi Kiến trúc CSS (Bắt buộc)
- **Hành động:** Chuyển toàn bộ Inline Styles trong `StoreHome.jsx` sang tệp `StoreHome.css` riêng biệt.
- **Lợi ích:** Giải phóng sức mạnh của CSS thuần, cho phép tạo các hiệu ứng Hover, Keyframe Animations mượt mà và dễ bảo trì hơn.

### 2. Hero Section Động (Dynamic Hero Banner)
- Thay thế Banner tĩnh hiện tại bằng một **Bố cục Bất đối xứng (Asymmetrical Layout)** với Gradient nền hòa trộn tinh tế.
- Thêm hiệu ứng nổi (Floating animation) nhẹ nhàng cho hình ảnh minh họa quyển sách trên Banner để tạo cảm giác không gian 3D.

### 3. Tương tác Vi mô (Micro-interactions) cho Thẻ Sản Phẩm
- **Hover Effect:** Khi di chuột vào thẻ sách, thẻ sẽ nhẹ nhàng nâng lên (`translateY(-8px)`) kèm theo hiệu ứng đổ bóng phát sáng (Glow shadow).
- **Hình ảnh:** Ảnh bìa sách sẽ zoom nhẹ (`scale(1.05)`) bên trong khung bảo vệ (Overflow hidden) mang lại cảm giác sống động.
- **Nút Mua hàng:** Nút giỏ hàng sẽ ẩn đi và chỉ trượt từ dưới lên (Slide up) khi người dùng di chuột vào thẻ sách.

### 4. Glassmorphism (Hiệu ứng kính mờ)
- Thanh bộ lọc danh mục (Filter Bar) sẽ được thiết kế lại. Khi cuộn trang, thanh này có thể bám dính (Sticky) trên đỉnh với hiệu ứng nền kính mờ (`backdrop-filter: blur(10px)`) cực kỳ sang trọng mang hơi hướng Apple Design.

## Open Questions
1. Bạn có muốn sử dụng thêm thư viện `Swiper.js` để làm một băng chuyền (Carousel) sách bán chạy không, hay giữ nguyên dạng Lưới (Grid) truyền thống?
2. Bạn có đồng ý với việc loại bỏ Inline Style sang file CSS rời cho trang chủ không? (Đây là yếu tố tiên quyết để làm web đẹp hơn).

## Proposed Changes

### WebClient
#### [MODIFY] [StoreHome.jsx](file:///c:/Users/tumin/Downloads/Web-ban-sach-lau-main/Web-ban-sach-lau-main/WebClient/src/pages/StoreHome.jsx)
- Gỡ bỏ toàn bộ object `styles`.
- Thay thế bằng thẻ `className` tiêu chuẩn.
- Cấu trúc lại các thẻ HTML để hỗ trợ hiệu ứng.

#### [NEW] [StoreHome.css](file:///c:/Users/tumin/Downloads/Web-ban-sach-lau-main/Web-ban-sach-lau-main/WebClient/src/pages/StoreHome.css)
- Khai báo toàn bộ quy tắc thiết kế mới: Bố cục, Màu sắc, Gradient, Animations, Micro-interactions.

---
Vui lòng đưa ra quyết định hoặc góp ý để tôi có thể bắt tay vào lập trình ngay!
