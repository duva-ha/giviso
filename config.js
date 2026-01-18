// 1. Cấu hình Firebase (Dùng chung bộ Keys với Học sinh)
const firebaseConfig = {
    apiKey: "AIzaSyAV-XVaOyUiq1c-29VTaWjLKcEXrssnnTE",
    authDomain: "qlhs10a7.firebaseapp.com",
    projectId: "qlhs10a7",
    storageBucket: "qlhs10a7.firebasestorage.app",
    messagingSenderId: "584229565603",
    appId: "1:584229565603:web:d47a10f0a512a1a309bb16"
};

// 2. Khởi tạo Firebase nếu chưa có
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// 3. THIẾT LẬP BIẾN TOÀN CỤC (Window)
// Bước này cực kỳ quan trọng để QuizCreator.js và Database.js 
// nhận diện được lệnh "Phát đề" và "Lấy điểm"
window.db = firebase.firestore();
window.auth = firebase.auth();
window.firebase = firebase; // Thêm dòng này để các hàm FieldValue.serverTimestamp() hoạt động đúng

// Tạo biến tắt để code trong các file thành phần dễ gọi
const db = window.db;
const auth = window.auth;

console.log("🛠️ Giviso Pro: Hệ thống Quản trị đã sẵn sàng kết nối Cloud!");
