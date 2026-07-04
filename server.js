const express = require("express");
const cors = require("cors");
const serverless = require('serverless-http');

// Thử cả 3 kiểu import để tương thích nhiều phiên bản SDK
const PayOSModule = require("@payos/node");
const PayOS =
  PayOSModule.PayOS ||
  PayOSModule.default ||
  PayOSModule;

const app = express();

// ==========================
// CORS - Cấu hình tương thích toàn diện
// ==========================

const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      "http://localhost:5500",
      "http://127.0.0.1:5500",
      "https://voduongmaiviet.github.io"
    ];
    
    // Nới lỏng kiểm tra: Cho phép tất cả các nguồn từ GitHub Codespaces (.github.dev và .app.github.dev)
    if (!origin || 
        origin.includes("github.dev") || 
        origin.includes("app.github.dev") || 
        allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

app.use((req, res, next) => {
    console.log(
        new Date().toLocaleTimeString(),
        req.method,
        req.url
    );
    next();
});

// ==========================
// Cấu hình PayOS
// ==========================

require("dotenv").config();

const payos = new PayOS(
  process.env.PAYOS_CLIENT_ID,
  process.env.PAYOS_API_KEY,
  process.env.PAYOS_CHECKSUM_KEY
);

// ==========================
// Trang kiểm tra server
// ==========================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "PayOS Server đang hoạt động tốt."
  });
});

// ==========================
// Tạo link thanh toán
// ==========================

app.post("/create-payment-link", async (req, res) => {
  try {
    const { amount, description } = req.body;

    const orderCode = Date.now();

    const paymentData = {
      orderCode,
      amount: Number(amount),
      description: (description || "Thanh toan").substring(0, 25),
      cancelUrl: "https://google.com",
      returnUrl: "https://google.com"
    };

    const result = await payos.createPaymentLink(paymentData);

    res.json({
      success: true,
      orderCode,
      checkoutUrl: result.checkoutUrl,
      qrCode: result.qrCode,
      data: result
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
      error: err
    });

  }
});

// ==========================
// Kiểm tra thanh toán
// ==========================

app.get("/check-order/:orderCode", async (req, res) => {

  try {

    const orderCode = Number(req.params.orderCode);

    const info = await payos.getPaymentLinkInformation(orderCode);

    res.json({
      success: true,
      status: info.status,
      data: info
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message
    });

  }

});

// ==========================

module.exports.handler = serverless(app);