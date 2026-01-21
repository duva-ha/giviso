const { useState, useEffect, useRef } = React;

// 🟢 KHAI BÁO EMAIL ADMIN DUY NHẤT
const ADMIN_EMAIL = "dvhai.gv@gmail.com";

function App() {
    const [user, setUser] = useState(null);
    const [tab, setTab] = useState('baocao');
    const [results, setResults] = useState([]); 
    const [authChecking, setAuthChecking] = useState(true);
    
    // 1. THEO DÕI TRẠNG THÁI ĐĂNG NHẬP
    useEffect(() => {
        const unsub = auth.onAuthStateChanged(u => {
            setUser(u);
            setAuthChecking(false);
        });
        return () => unsub();
    }, []);

    // 2. LOGIC LẤY DỮ LIỆU ĐIỂM REALTIME
    useEffect(() => {
        if (!user || user.email !== ADMIN_EMAIL) return;
        
        // Lắng nghe ngăn tủ kết quả để đếm số lượng học sinh và làm báo cáo
        const unsubscribe = db.collection("quiz_results")
            .orderBy("createdAt", "desc") 
            .onSnapshot(snapshot => {
                const data = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    timestamp: doc.data().createdAt || new Date() 
                }));
                setResults(data);
            }, err => console.error("Lỗi Firebase:", err));
            
        return () => unsubscribe();
    }, [user]);

    // --- GIAO DIỆN CHỜ & ĐĂNG NHẬP (Giữ nguyên như bản cũ của thầy) ---
    if (authChecking) return (
        <div className="h-screen flex items-center justify-center bg-slate-900 px-6">
            <div className="flex flex-col items-center">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <div className="text-white font-black uppercase tracking-[0.3em] text-xs animate-pulse">Giviso Pro Loading...</div>
            </div>
        </div>
    );

    if (!user) return (
        <div className="h-screen flex flex-col items-center justify-center bg-slate-900 p-6 text-center">
            <div className="text-7xl mb-8 animate-bounce">🛡️</div>
            <h1 className="text-white text-4xl lg:text-5xl font-black mb-4 italic uppercase tracking-tighter">Giviso Pro</h1>
            <button onClick={() => auth.signInWithPopup(new firebase.auth.GoogleAuthProvider())} className="bg-white px-10 py-5 rounded-2xl font-black text-slate-900 shadow-2xl active:scale-95 transition-all flex items-center gap-4 hover:bg-blue-50">
                <img src="https://www.google.com/favicon.ico" className="w-6 h-6" alt="google" /> ĐĂNG NHẬP ADMIN
            </button>
        </div>
    );

    if (user.email !== ADMIN_EMAIL) return (
        <div className="h-screen flex flex-col items-center justify-center bg-red-50 p-8 text-center text-red-600 font-black">
            🚫 TRUY CẬP BỊ TỪ CHỐI
            <button onClick={() => auth.signOut()} className="mt-4 bg-red-600 text-white px-6 py-2 rounded-xl">THOÁT</button>
        </div>
    );

    // 4. GIAO DIỆN QUẢN TRỊ CHÍNH
    return (
        <div className="flex h-screen overflow-hidden bg-slate-50 flex-col lg:flex-row text-left">
            
            {/* SIDEBAR: Thầy nhớ kiểm tra file Sidebar.js đã nhận các props này chưa */}
            <Sidebar tab={tab} setTab={setTab} user={user} auth={auth} />

            <main className="flex-1 bg-white relative overflow-hidden flex flex-col">
                
                <div className="flex-1 overflow-y-auto relative">
                    {/* TAB BÁO CÁO: Hiện danh sách điểm */}
                    {tab === 'baocao' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <GradeReport results={results} />
                        </div>
                    )}
                    
                    {/* TAB ĐỀ KIỂM TRA: Quan trọng nhất là bổ sung results={results} */}
                    {tab === 'dekiemtra' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 h-full">
                            <QuizCreator 
                                db={db} 
                                firebase={firebase} 
                                // BỔ SUNG DÒNG NÀY: Để QuizCreator đếm được số học sinh làm bài
                                results={results} 
                            />
                        </div>
                    )}
                    
                    {!['baocao', 'dekiemtra'].includes(tab) && (
                        <div className="flex flex-col h-full p-12 items-center justify-center">
                             <h2 className="text-2xl font-black text-slate-800 uppercase italic">Tính năng {tab}</h2>
                             <p className="text-slate-400 font-bold mt-4 uppercase text-[10px]">Đang phát triển...</p>
                        </div>
                    )}
                </div>

            </main>
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
