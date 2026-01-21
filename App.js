const { useState, useEffect, useRef } = React;

// 🟢 KHAI BÁO EMAIL ADMIN DUY NHẤT
const ADMIN_EMAIL = "dvhai.gv@gmail.com";

function App() {
    const [user, setUser] = useState(null);
    const [tab, setTab] = useState('baocao');
    const [results, setResults] = useState([]); 
    const [authChecking, setAuthChecking] = useState(true);
    
    // States cho các tính năng phụ (Ghi chú/File)
    const [notes, setNotes] = useState([]);
    const [text, setText] = useState("");

    // 1. THEO DÕI TRẠNG THÁI ĐĂNG NHẬP
    useEffect(() => {
        const unsub = auth.onAuthStateChanged(u => {
            setUser(u);
            setAuthChecking(false);
        });
        return () => unsub();
    }, []);

    // 2. LOGIC LẤY DỮ LIỆU ĐIỂM (Cập nhật Realtime & Khớp tên trường createdAt)
    useEffect(() => {
        // Chỉ lấy dữ liệu nếu đúng là thầy Hải đăng nhập
        if (!user || user.email !== ADMIN_EMAIL) return;
        
        console.log("📡 Đang kết nối ngăn tủ quiz_results...");
        const unsubscribe = db.collection("quiz_results")
            // Sửa từ 'timestamp' thành 'createdAt' để khớp với App Học Sinh
            .orderBy("createdAt", "desc") 
            .onSnapshot(snapshot => {
                const data = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    // Chống lỗi nếu timestamp chưa kịp trả về từ server
                    timestamp: doc.data().createdAt || new Date() 
                }));
                console.log("📊 Đã cập nhật danh sách điểm mới:", data.length);
                setResults(data);
            }, err => {
                console.error("Lỗi lấy điểm từ Firebase:", err);
                // Mẹo: Nếu Firebase báo lỗi Index, thầy cần nhấn vào link trong console để tạo Index
            });
            
        return () => unsubscribe();
    }, [user]);

    // 3. GIAO DIỆN TRẠNG THÁI (LOADING / LOGIN / DENIED)

    // A. Đang nạp ứng dụng
    if (authChecking) return (
        <div className="h-screen flex items-center justify-center bg-slate-900 px-6">
            <div className="flex flex-col items-center">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <div className="text-white font-black uppercase tracking-[0.3em] text-xs animate-pulse">Giviso Pro Loading...</div>
            </div>
        </div>
    );

    // B. Màn hình Đăng nhập
    if (!user) return (
        <div className="h-screen flex flex-col items-center justify-center bg-slate-900 p-6 text-center">
            <div className="text-7xl mb-8 animate-bounce">🛡️</div>
            <h1 className="text-white text-4xl lg:text-5xl font-black mb-4 italic uppercase tracking-tighter">Giviso Pro</h1>
            <p className="text-slate-400 font-bold mb-10 uppercase text-[10px] tracking-widest">Hệ thống quản trị giáo dục thông minh</p>
            <button 
                onClick={() => auth.signInWithPopup(new firebase.auth.GoogleAuthProvider())} 
                className="bg-white px-10 py-5 rounded-2xl font-black text-slate-900 shadow-2xl active:scale-95 transition-all flex items-center gap-4 hover:bg-blue-50"
            >
                <img src="https://www.google.com/favicon.ico" className="w-6 h-6" alt="google" />
                ĐĂNG NHẬP ADMIN
            </button>
        </div>
    );

    // C. Chặn người lạ (Không phải email của thầy Hải)
    if (user.email !== ADMIN_EMAIL) return (
        <div className="h-screen flex flex-col items-center justify-center bg-red-50 p-8 text-center">
            <div className="text-8xl mb-6">🚫</div>
            <h1 className="text-3xl font-black text-red-600 uppercase mb-4">Quyền truy cập bị từ chối</h1>
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-red-100 mb-8">
                <p className="text-slate-500 font-medium mb-2 text-sm">Tài khoản hiện tại:</p>
                <p className="text-red-500 font-black text-lg underline">{user.email}</p>
            </div>
            <p className="text-slate-400 text-xs font-bold uppercase mb-8 leading-loose">
                Vui lòng liên hệ quản trị viên<br/>hoặc đăng nhập bằng đúng email của thầy Hải.
            </p>
            <button 
                onClick={() => auth.signOut()} 
                className="bg-red-600 text-white px-10 py-4 rounded-2xl font-black shadow-xl active:scale-95 transition-all"
            >
                THOÁT TÀI KHOẢN
            </button>
        </div>
    );

    // 4. GIAO DIỆN QUẢN TRỊ CHÍNH (ĐÃ TỐI ƯU MOBILE)
    return (
        <div className="flex h-screen overflow-hidden bg-slate-50 flex-col lg:flex-row">
            
            {/* THANH MENU (SIDEBAR) - Tự co giãn theo màn hình */}
            <Sidebar tab={tab} setTab={setTab} user={user} auth={auth} />

            <main className="flex-1 bg-white relative overflow-hidden flex flex-col">
                
                {/* NỘI DUNG CÁC TAB */}
                <div className="flex-1 overflow-y-auto relative">
                    {/* Tab Báo cáo điểm: Truyền dữ liệu results đã lấy được */}
                    {tab === 'baocao' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <GradeReport results={results} />
                        </div>
                    )}
                    
                    {/* Tab Phát đề: Truyền db và firebase để xử lý phát đề */}
                    {tab === 'dekiemtra' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 h-full">
                            <QuizCreator db={db} firebase={firebase} />
                        </div>
                    )}
                    
                    {/* Các tab khác đang phát triển */}
                    {!['baocao', 'dekiemtra'].includes(tab) && (
                        <div className="flex flex-col h-full p-6 lg:p-12 items-center justify-center">
                             <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center text-4xl mb-6">⚙️</div>
                             <h2 className="text-2xl font-black text-slate-800 uppercase italic">Quản lý {tab}</h2>
                             <p className="text-slate-400 font-bold mt-4 uppercase text-[10px] tracking-[0.3em]">Feature coming soon</p>
                        </div>
                    )}
                </div>

            </main>
        </div>
    );
}

// 5. KHỞI CHẠY (RENDER)
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
