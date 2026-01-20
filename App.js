const { useState, useEffect, useRef } = React;

function App() {
    const [user, setUser] = useState(null);
    const [tab, setTab] = useState('baocao');
    const [results, setResults] = useState([]); // TRẠNG THÁI LƯU ĐIỂM SỐ
    const [notes, setNotes] = useState([]);
    const [text, setText] = useState("");
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        const unsub = auth.onAuthStateChanged(u => setUser(u));
        return () => unsub();
    }, []);

    // 1. LOGIC LẤY DỮ LIỆU ĐIỂM (Dùng cho tab Báo cáo)
    useEffect(() => {
        if (!user) return;
        // Lấy dữ liệu từ ngăn tủ "quiz_results" trên Firebase
        const unsubscribe = db.collection("quiz_results")
            .orderBy("timestamp", "desc")
            .onSnapshot(snapshot => {
                const data = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                console.log("📊 Đã nhận dữ liệu điểm:", data.length);
                setResults(data);
            });
        return () => unsubscribe();
    }, [user]);

    // 2. LOGIC LẤY GHI CHÚ (Notes)
    useEffect(() => {
        if (!user || ['baocao', 'dekiemtra'].includes(tab)) return;
        return db.collection("notes")
            .where("userId", "==", user.uid)
            .where("category", "==", tab)
            .onSnapshot(s => {
                const data = s.docs.map(d => ({id: d.id, ...d.data()}));
                setNotes(data.sort((a,b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0)));
            });
    }, [user, tab]);

    if (!user) return (
        <div className="h-screen flex items-center justify-center bg-slate-900 p-6">
            <button onClick={() => auth.signInWithPopup(new firebase.auth.GoogleAuthProvider())} className="bg-white px-10 py-5 rounded-3xl font-black text-slate-900 shadow-2xl active:scale-95 transition-all">ĐĂNG NHẬP GIVISO PRO</button>
        </div>
    );

    return (
        <div className="flex h-screen overflow-hidden bg-slate-50">
            {/* COMPONENT MENU */}
            <Sidebar tab={tab} setTab={setTab} user={user} auth={auth} />

            <main className="flex-1 bg-white relative overflow-hidden">
                {/* 🔴 SỬA LỖI TẠI ĐÂY: Truyền results vào GradeReport */}
                {tab === 'baocao' && <GradeReport results={results} />}
                
                {tab === 'dekiemtra' && <QuizCreator db={db} firebase={firebase} />}
                
                {/* TAB GIAO ÁN / BÀI GIẢNG */}
                {!['baocao', 'dekiemtra'].includes(tab) && (
                    <div className="flex flex-col h-full p-8 animate-in fade-in duration-500 overflow-y-auto">
                         <h2 className="text-2xl font-black mb-6 uppercase tracking-tight">Quản lý {tab}</h2>
                         {/* Form và danh sách ghi chú của thầy ở đây */}
                         <p className="text-slate-400 italic">Tính năng soạn bài đang được nạp...</p>
                    </div>
                )}
            </main>
        </div>
    );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
