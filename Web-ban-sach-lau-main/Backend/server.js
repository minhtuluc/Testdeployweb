require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();

/* ======================= MIDDLEWARE ======================= */
app.use(cors({ origin: "*" }));
app.use(express.json());

/* ======================= ROUTES ======================= */
const authRoutes      = require("./src/routes/auth");
const userRoutes      = require("./src/routes/user");
const homeRoutes      = require("./src/routes/home");
const productRoutes   = require("./src/routes/products");
const addressRoutes   = require("./src/routes/addresses");
const cartRoutes      = require("./src/routes/cart");
const favoriteRoutes  = require("./src/routes/favorites");
const checkoutRoutes  = require("./src/routes/checkout");
const orderRoutes     = require("./src/routes/orders");
const reviewRoutes    = require("./src/routes/reviews");
const uploadRoutes    = require("./src/routes/upload");
const adminRoutes     = require("./src/routes/admin");
const voucherRoutes   = require("./src/routes/vouchers");
const chatRoutes      = require("./src/routes/chat");
const shipperRoutes   = require("./src/routes/shipper");

app.use("/auth",      authRoutes);
app.use("/user",      userRoutes);
app.use("/home",      homeRoutes);
app.use("/products",  productRoutes);
app.use("/addresses", addressRoutes);
app.use("/cart",      cartRoutes);
app.use("/favorites", favoriteRoutes);
app.use("/checkout",  checkoutRoutes);
app.use("/orders",    orderRoutes);
app.use("/reviews",   reviewRoutes);
app.use("/upload",    uploadRoutes);
app.use("/admin/vouchers", voucherRoutes);
app.use("/admin",     adminRoutes);
app.use("/vouchers",  voucherRoutes);
app.use("/chat",      chatRoutes);
app.use("/shipper",   shipperRoutes);

// Upload init-storage (giữ ở root)
const uploadRouter = require("./src/routes/upload");
app.post("/init-storage", (req, res, next) => {
  // Forward to upload router
  req.url = "/init-storage";
  uploadRouter(req, res, next);
});

/* ======================= START SERVER ======================= */
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 API running: http://localhost:${PORT}`);
});
