const CURRENT_HOST = window.location.hostname;
let API_URL = "http://localhost:3000"; // Mặc định khi chạy local Offline

// SỬA ĐỔI: Kiểm tra và phân luồng URL thông minh
if (CURRENT_HOST.includes("github.dev")) {
    // 1. Nếu bạn đang xem trước (Preview) ứng dụng ngay trong Codespaces
    const workspaceName = CURRENT_HOST.replace(".github.dev", "");
    API_URL = `https://${workspaceName}-3000.app.github.dev`;
} else if (CURRENT_HOST.includes("github.io") || CURRENT_HOST.includes("gmaiviet.github.io")) {
    // 2. Nếu chạy chính thức trên GitHub Pages (như trên thiết bị di động của bạn)
    // HÃY ĐẢM BẢO URL DƯỚI ĐÂY KHỚP VỚI ĐƯỜNG LINK BACKEND CODESPACES ĐANG HOẠT ĐỘNG CỦA BẠN
    API_URL = "https://automatic-tribble-jr5gx4rg7q6gfqxg9.github.dev";
}

console.log("Cấu hình API kết nối tới mục tiêu:", API_URL);

let currentOrderCode = null;
let checkInterval = null;

function removeSign(str) {
    return str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D")
        .toUpperCase()
        .replace(/\s+/g, " ")
        .trim();
}

async function generatePaymentQR() {
    const rawName = document.getElementById("studentName").value.trim();
    const rawContent = document.getElementById("paymentContent").value.trim();
    const amount = document.getElementById("tuitionAmount").value.trim();

    if (!rawName || !rawContent || !amount) {
        Swal.fire({
            icon: "warning",
            title: "Thiếu thông tin",
            text: "Vui lòng nhập đầy đủ thông tin."
        });
        return;
    }

    const memo = `${removeSign(rawName)} ${removeSign(rawContent)}`
        .substring(0, 25)
        .trim();

    try {
        Swal.fire({
            title: "Đang tạo mã QR...",
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
        });

        const response = await fetch(`${API_URL}/create-payment-link`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                amount: Number(amount),
                description: memo
            })
        });

        const result = await response.json();
        Swal.close();
        console.log(result);

        if (!result.success) {
            throw new Error(result.message || result.error);
        }

        currentOrderCode = result.orderCode;

        document.getElementById("inputForm").style.display = "none";
        document.getElementById("qrSection").style.display = "block";

        document.getElementById("displayAmount").innerText =
            Number(amount).toLocaleString("vi-VN") + " đ";

        document.getElementById("orderMemo").innerText = memo;
        document.getElementById("successStudentInfo").innerText = rawName;

        if (result.qrCode) {
            document.getElementById("qrImage").src = result.qrCode;
        } else if (result.data && result.data.qrCode) {
            document.getElementById("qrImage").src = result.data.qrCode;
        } else {
            Swal.fire({
                icon: "error",
                title: "Không nhận được QR từ PayOS"
            });
            return;
        }

        document.getElementById("labelText").innerText = "Đang chờ thanh toán...";
        clearInterval(checkInterval);
        checkInterval = setInterval(verifyPaymentRealTime, 2000);

    } catch (err) {
        console.error(err);
        Swal.close();
        Swal.fire({
            icon: "error",
            title: "Lỗi kết nối",
            text: "Không thể gọi tới máy chủ API. Vui lòng kiểm tra tab PORTS đã chuyển sang chế độ 'Public' chưa?"
        });
    }
}

async function verifyPaymentRealTime() {
    if (!currentOrderCode) return;

    try {
        const response = await fetch(`${API_URL}/check-order/${currentOrderCode}`);
        const result = await response.json();
        console.log(result);

        if (result.success && result.status === "PAID") {
            showSuccessNotification();
        }
    } catch (err) {
        console.log(err);
    }
}

function showSuccessNotification() {
    clearInterval(checkInterval);
    Swal.fire({
        icon: "success",
        title: "Thanh toán thành công",
        text: "Hệ thống đã nhận được giao dịch.",
        timer: 2500,
        showConfirmButton: false
    }).then(() => {
        document.getElementById("qrSection").style.display = "none";
        document.getElementById("successBox").style.display = "block";
    });
}

function triggerMockSuccess() {
    showSuccessNotification();
}