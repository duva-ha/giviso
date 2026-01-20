const { useState, useEffect, useRef } = React;

// 🟢 KHAI BÁO EMAIL ADMIN DUY NHẤT
const ADMIN_EMAIL = "dvhai.gv@gmail.com";

function App() {
    const [user, setUser] = useState(null);
    const [tab, setTab] = useState('baocao');
    const [results, setResults] = useState([]); 
    const [authChecking, setAuthChecking] = useState(true); // Trạng thái đang kiểm tra tài khoản
    
    const [notes, setNotes] = useState([]);
    const [text, setText] = useState("");
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    // 1. THEO DÕI TRẠNG THÁI ĐĂNG NHẬP
    useEffect(() => {
        const unsub = auth.onAuthStateChanged(u => {
            setUser(u);
            setAuthChecking(false);
        });
        return () => unsub();
    }, []);

    // 2. LOGIC LẤY DỮ LIỆU ĐIỂM (Chỉ chạy khi đúng là Admin)
    useEffect(() => {
        if (!user || user.email !== ADMIN_EMAIL) return;
        
        const unsubscribe = db.collection("quiz_results")
            .orderBy("timestamp", "desc")
            .onSnapshot(snapshot => {
                const data = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                console.log("📊 Đã nhận dữ liệu điểm:", data.length);
                setResults(data);
            }, err => console.error("Lỗi lấy điểm:", err));
            
        return () => unsubscribe();
    }, [user]);

    // 3. LOGIC LẤY GHI CHÚ
    useEffect(() => {
        if (!user || user.email !== ADMIN_EMAIL || ['baocao', 'dekiemtra'].includes(tab)) return;
        return db.collection("notes")
            .where("userId", "==", user.uid)
            .where("category", "==", tab)
            .onSnapshot(s => {
                const data = s.docs.map(d => ({id: d.id, ...d.data()}));
                setNotes(data.sort((a,b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0)));
            });
    }, [user, tab]);

    // --- CÁC GIAO DIỆN TRẠNG THÁI ---

    // A. Đang tải trang
    if (authChecking) return (
        <div className="h-screen flex items-center justify-center bg-slate-900">
            <div className="text-white font-bold animate-pulse uppercase tracking-widest">Giviso đang nạp...</div>
        </div>
    );

    // B. Chưa đăng nhập
    if (!user) return (
        <div className="h-screen flex flex-col items-center justify-center bg-slate-900 p-6 text-center">
            <div className="text-6xl mb-8 animate-bounce">🛡️</div>
            <h1 className="text-white text-4xl font-black mb-10 italic uppercase tracking-tighter">Giviso Pro Admin</h1>
            <button 
                onClick={() => auth.signInWithPopup(new firebase.auth.GoogleAuthProvider())} 
                className="bg-white px-12 py-5 rounded-[2rem] font-black text-slate-900 shadow-2xl active:scale-95 transition-all flex items-center gap-3 hover:bg-blue-50"
            >
                <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="google" />
                ĐĂNG NHẬP HỆ THỐNG
            </button>
        </div>
    );

    // C. Đăng nhập sai Email (KHÔNG PHẢI THẦY HẢI)
    if (user.email !== ADMIN_EMAIL) return (
        <div className="h-screen flex flex-col items-center justify-center bg-red-50 p-6 text-center animate-in fade-in duration-500">
            <div className="text-8xl mb-6">🚫</div>
            <h1 className="text-3xl font-black text-red-600 uppercase mb-2">Truy cập bị từ chối</h1>
            <p className="text-slate-600 font-bold mb-8 max-w-md leading-relaxed">
                Tài khoản <span className="text-red-500 underline">{user.email}</span> không có quyền quản trị.<br/>
                Vui lòng đăng nhập bằng Email Admin để tiếp tục.
            </p>
            <button 
                onClick={() => auth.signOut()} 
                className="bg-red-600 text-white px-10 py-4 rounded-2xl font-black shadow-xl hover:bg-red-700 transition-all active:scale-95"
            >
                ĐĂNG XUẤT VÀ THỬ LẠI
            </button>
        </div>
    );

    // D. GIAO DIỆN CHÍNH (Chỉ hiện khi đúng là thầy Hải)
    return (
        <div className="flex h-screen overflow-hidden bg-slate-50">
            {/* SIDEBAR */}
            <Sidebar tab={tab} setTab={setTab} user={user} auth={auth} />

            <main className="flex-1 bg-white relative overflow-hidden flex flex-col">
                {/* HIỂN THỊ CÁC TAB */}
                <div className="flex-1 overflow-hidden relative">
                    {tab === 'baocao' && <GradeReport results={results} />}
                    
                    {tab === 'dekiemtra' && <QuizCreator db={db} firebase={firebase} />}
                    
                    {!['baocao', 'dekiemtra'].includes(tab) && (
                        <div className="flex flex-col h-full p-8 animate-in fade-in duration-500 overflow-y-auto">
                             <h2 className="text-2xl font-black mb-6 uppercase tracking-tight text-slate-800">Quản lý {tab}</h2>
                             <div className="p-20 border-4 border-dashed border-slate-100 rounded-[3rem] text-center">
                                <p className="text-slate-300 font-black uppercase italic tracking-widest">Tính năng đang được phát triển...</p>
                             </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

// KHỞI CHẠY APP
const container = document.getElementById('root');
const root = ReactDOM.createRoot(container);
root.render(<App />);
