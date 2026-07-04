    const bankConfig = {
        bankId: "agribank",          
        accountNo: "5504215009186", 
        accountName: "MAI VAN VIET" 
    };

    let checkInterval; 

    function removeSign(str) {
        str = str.toUpperCase();
        str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ấ|Ặ|Ẳ|Ẵ/g, "A");
        str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
        str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
        str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
        str = str.replace(/Ù|Ú|Ụ|Ủ|Ã|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
        str = str.replace(/Ỳ|Ý|Y|Ỷ|Ỹ/g, "Y");
        str = str.replace(/Đ/g, "D");
        str = str.replace(/[^A-Z0-9 ]/g, ""); 
        return str;
    }

    function generatePaymentQR() {
        let rawName = document.getElementById('studentName').value.trim();
        let rawContent = document.getElementById('paymentContent').value.trim();
        let amount = document.getElementById('tuitionAmount').value.trim();

        if (!rawName || !rawContent || !amount) {
            Swal.fire({
                icon: "warning",
                title: "Chú ý!",
                text: "Vui lòng điền đầy đủ tất cả các trường thông tin!",
                confirmButtonColor: "#0288d1"
            });
            return;
        }

        let cleanName = removeSign(rawName).replace(/\s+/g, " "); 
        let cleanContent = removeSign(rawContent).replace(/\s+/g, " ");

        // SỬA ĐỔI CHÍNH: Xóa bỏ hoàn toàn lệnh .substring() để lấy trọn vẹn độ dài chuỗi ký tự bạn nhập vào.
        const currentMemo = `${cleanName} ${cleanContent}`.trim(); 

        document.getElementById('displayAmount').innerText = parseInt(amount).toLocaleString('vi-VN') + " đ";
        document.getElementById('orderMemo').innerText = currentMemo;

        const qrUrl = `https://img.vietqr.io/image/${bankConfig.bankId}-${bankConfig.accountNo}-qr_only.jpg?amount=${amount}&addInfo=${encodeURIComponent(currentMemo)}&accountName=${encodeURIComponent(bankConfig.accountName)}`;
        
        document.getElementById('qrImage').src = qrUrl;

        document.getElementById('inputForm').style.display = 'none';
        document.getElementById('qrSection').style.display = 'block';

        document.getElementById('successStudentInfo').innerText = `${cleanName} (${cleanContent})`;

        checkInterval = setInterval(() => {
            console.log(`Đang quét tài khoản tìm nội dung: [${currentMemo}] với số tiền: ${amount}đ...`);
        }, 3000);
    }

    function triggerMockSuccess() {
        Swal.fire({
            icon: "success",
            title: "Thành công!",
            text: "Hệ thống đã nhận được tiền thanh toán đơn hàng.",
            timer: 2500,
            showConfirmButton: false
        }).then(() => {
            mockPaymentSuccess();
        });
    }

    function mockPaymentSuccess() {
        clearInterval(checkInterval);
        document.getElementById('qrSection').style.display = 'none';
        document.getElementById('successBox').style.display = 'block';
    }
