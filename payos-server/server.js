require("dotenv").config();
const express = require('express');
const cors = require('cors');
const { PayOS } = require("@payos/node");

const app = express();
app.use(cors());
app.use(express.json());

// Khởi tạo PayOS từ biến môi trường của hệ thống (Ví dụ: Codespaces)
const payos = new PayOS({
    clientId: process.env.PAYOS_CLIENT_ID,
    apiKey: process.env.PAYOS_API_KEY,
    checksumKey: process.env.PAYOS_CHECKSUM_KEY,
});

app.post('/create-payment-link', async (req, res) => {
    try {
        const { amount, description } = req.body;
        const orderCode = Math.floor(Math.random() * 900000) + 100000;

        const paymentData = {
            orderCode: orderCode,
            amount: parseInt(amount),
            description: description ? description.substring(0, 25) : "Thanh toan",
            cancelUrl: 'https://google.com',
            returnUrl: 'https://google.com'
        };

        const paymentLinkData = await payos.createPaymentLink(paymentData);
        res.json({ success: true, data: paymentLinkData, orderCode: orderCode });
    } catch (error) {
        console.error("Lỗi tạo link thanh toán:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/check-order/:orderCode', async (req, res) => {
    try {
        const orderCode = req.params.orderCode;
        const orderInfo = await payos.getPaymentLinkInformation(orderCode);
        
        if (orderInfo && orderInfo.status === 'PAID') {
            return res.json({ success: true, status: 'PAID' });
        }
        res.json({ success: true, status: orderInfo.status });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server đang chạy tại: http://localhost:${PORT}`);
});