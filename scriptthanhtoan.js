// Thay thế localhost bằng đường link Public lấy từ tab PORTS trên Codespaces của bạn
const API_URL = "https://symmetrical-meme-xrw4j9r4p9qp29xjg-3000.app.github.dev";

// ===============================
// Cấu hình Server
// ===============================

let currentOrderCode = null;
let checkInterval = null;

// ===============================
// Bỏ dấu tiếng Việt
// ===============================
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

// ===============================
// Tạo QR PayOS
// ===============================
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
        .substring(0,25)
        .trim();

    try {

        Swal.fire({
            title:"Đang tạo mã QR...",
            allowOutsideClick:false,
            didOpen:()=>Swal.showLoading()
        });

        const response = await fetch(`${API_URL}/create-payment-link`,{

            method:"POST",

            headers:{
                "Content-Type":"application/json"
            },

            body:JSON.stringify({

                amount:Number(amount),

                description:memo

            })

        });

        const result = await response.json();

        Swal.close();

        console.log(result);

        if(!result.success){

            throw new Error(result.message || result.error);

        }

        currentOrderCode = result.orderCode;

        // ======================
        // Hiển thị giao diện
        // ======================

        document.getElementById("inputForm").style.display="none";
        document.getElementById("qrSection").style.display="block";

        document.getElementById("displayAmount").innerText=
            Number(amount).toLocaleString("vi-VN")+" đ";

        document.getElementById("orderMemo").innerText=memo;

        document.getElementById("successStudentInfo").innerText=
            rawName;

        // ======================
        // QR từ PayOS
        // ======================

        if(result.qrCode){

            document.getElementById("qrImage").src=result.qrCode;

        }
        else if(result.data && result.data.qrCode){

            document.getElementById("qrImage").src=result.data.qrCode;

        }
        else{

            Swal.fire({
                icon:"error",
                title:"Không nhận được QR từ PayOS"
            });

            return;
        }

        document.getElementById("labelText").innerText=
        "Đang chờ thanh toán...";

        clearInterval(checkInterval);

        checkInterval=setInterval(verifyPaymentRealTime,2000);

    }
    catch(err){

        console.error(err);

        Swal.close();

        Swal.fire({

            icon:"error",

            title:"Lỗi",

            text:err.message

        });

    }

}

// ===============================
// Kiểm tra thanh toán
// ===============================
async function verifyPaymentRealTime(){

    if(!currentOrderCode){

        return;

    }

    try{

        const response=await fetch(

            `${API_URL}/check-order/${currentOrderCode}`

        );

        const result=await response.json();

        console.log(result);

        if(result.success && result.status==="PAID"){

            showSuccessNotification();

        }

    }

    catch(err){

        console.log(err);

    }

}

// ===============================
// Thành công
// ===============================
function showSuccessNotification(){

    clearInterval(checkInterval);

    Swal.fire({

        icon:"success",

        title:"Thanh toán thành công",

        text:"Hệ thống đã nhận được giao dịch.",

        timer:2500,

        showConfirmButton:false

    }).then(()=>{

        document.getElementById("qrSection").style.display="none";

        document.getElementById("successBox").style.display="block";

    });

}

// ===============================
// Test nhanh
// ===============================
function triggerMockSuccess(){

    showSuccessNotification();

}