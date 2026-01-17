function QuizCreator({ db, firebase }) {
    const [rawText, setRawText] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [quizConfig, setQuizConfig] = useState({
        title: "",
        time: 15,
        grade: "12",
        shuffleQuestions: false,
        shuffleOptions: false,
        questions: []
    });

    // --- LOGIC TỰ ĐỘNG PHÂN TÍCH ĐỀ THI ---
    useEffect(() => {
        if (!rawText.trim()) {
            setQuizConfig(prev => ({ ...prev, questions: [] }));
            return;
        }

        // Tách câu dựa trên chữ "Câu X:" hoặc "Câu X."
        const parts = rawText.split(/Câu\s*\d+[:.]/g).filter(p => p.trim().length > 5);
        
        const parsed = parts.map(part => {
            const lines = part.split('\n').map(l => l.trim()).filter(l => l.length > 0);
            const questionText = lines[0]; // Dòng đầu là nội dung câu hỏi
            
            // Lọc ra các dòng đáp án: chấp nhận cả "A." và "*A."
            const optionLines = lines.filter(l => /^[A-D][.:)]|^\*[A-D][.:)]/.test(l));
            
            let correct = 0;
            const options = optionLines.map((line, index) => {
                // Kiểm tra nếu đáp án bắt đầu bằng dấu *
                if (line.startsWith('*')) {
                    correct = index;
                    // Xóa cụm *A. hoặc *A: để lấy nội dung text
                    return line.replace(/^\*[A-D][.:)]\s*/, "");
                }
                // Nếu không có *, xóa cụm A. hoặc A:
                return line.replace(/^[A-D][.:)]\s*/, "");
            });

            return { 
                q: questionText, 
                a: options.length > 0 ? options : ["Đáp án A", "Đáp án B", "Đáp án C", "Đáp án D"], 
                c: correct 
            };
        });

        setQuizConfig(prev => ({ ...prev, questions: parsed }));
    }, [rawText]);

    // --- HÀM LƯU ĐỀ LÊN FIREBASE ---
    const handlePublish = async () => {
        if (!quizConfig.title || quizConfig.questions.length === 0) {
            alert("Thầy hãy nhập tiêu đề bài thi và nội dung câu hỏi nhé!");
            return;
        }

        setIsSaving(true);
        try {
            await db.collection("quizzes").add({
                ...quizConfig,
                time: quizConfig.time * 60, // Chuyển sang giây
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            alert("✅ Đã phát đề thành công! Học sinh đã có thể vào làm bài.");
            setRawText("");
            setQuizConfig(prev => ({ ...prev, title: "", questions: [] }));
        } catch (e) {
            alert("Lỗi khi lưu đề: " + e.message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex h-full gap-8 p-8 overflow-hidden bg-slate-50 animate-in">
            {/* CỘT TRÁI: NHẬP LIỆU */}
            <div className="flex-1 flex flex-col gap-6">
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
                    <div className="relative">
                        <input 
                            className="w-full text-3xl font-black outline-none border-b-4 border-slate-50 focus:border-blue-600 pb-3 transition-all placeholder-slate-200" 
                            placeholder="Tên bài kiểm tra..." 
                            value={quizConfig.title}
                            onChange={e => setQuizConfig({...quizConfig, title: e.target.value})}
                        />
                    </div>
                    
                    <div className="flex items-center gap-8">
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Khối</span>
                            <select value={quizConfig.grade} onChange={e => setQuizConfig({...quizConfig, grade: e.target.value})} className="bg-slate-100 px-4 py-2 rounded-xl font-bold text-xs outline-none focus:ring-2 ring-blue-500/20">
                                <option value="10">Khối 10</option>
                                <option value="11">Khối 11</option>
                                <option value="12">Khối 12</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Thời gian (Phút)</span>
                            <input type="number" value={quizConfig.time} onChange={e => setQuizConfig({...quizConfig, time: parseInt(e.target.value) || 0})} className="w-20 bg-slate-100 px-4 py-2 rounded-xl font-bold text-xs outline-none" />
                        </div>
                    </div>
                </div>
                
                <div className="flex-1 relative group">
                    <textarea 
                        className="w-full h-full p-8 rounded-[3rem] border-2 border-slate-100 shadow-inner outline-none focus:border-blue-500 focus:ring-8 ring-blue-500/5 resize-none font-medium text-slate-600 custom-scroll transition-all"
                        placeholder={"SOẠN ĐỀ TẠI ĐÂY...\n\nVí dụ:\nCâu 1: Đâu là thủ đô Việt Nam?\n*A. Hà Nội\nB. Đà Nẵng\nC. TP.HCM"}
                        value={rawText}
                        onChange={e => setRawText(e.target.value)}
                    />
                </div>
            </div>

            {/* CỘT PHẢI: BẢN XEM TRƯỚC (PREVIEW) */}
            <div className="w-[480px] flex flex-col">
                <div className="flex-1 bg-white rounded-[3rem] p-8 overflow-y-auto custom-scroll border-2 border-dashed border-slate-200 relative">
                    <div className="sticky top-0 bg-white/90 backdrop-blur pb-4 mb-4 border-b border-slate-50 z-10 flex justify-between items-center">
                        <h3 className="font-black text-[10px] uppercase text-slate-400 tracking-[0.3em]">Bản xem trước ({quizConfig.questions.length})</h3>
                        {quizConfig.questions.length > 0 && <span className="bg-emerald-500 w-2 h-2 rounded-full animate-pulse"></span>}
                    </div>
                    
                    {quizConfig.questions.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-200">
                            <span className="text-8xl mb-6">🖋️</span>
                            <p className="font-black text-[10px] uppercase tracking-widest">Đang đợi thầy nhập nội dung đề...</p>
                        </div>
                    ) : (
                        quizConfig.questions.map((q, i) => (
                            <div key={i} className="bg-slate-50/50 p-6 rounded-[2rem] mb-6 border border-slate-100 preview-card group">
                                <p className="font-bold text-slate-800 text-sm mb-4 leading-relaxed line-clamp-3">{i + 1}. {q.q}</p>
                                <div className="space-y-2">
                                    {q.a.map((opt, idx) => (
                                        <div key={idx} className={`text-[10px] p-3 rounded-2xl font-bold flex items-center gap-3 transition-all ${q.c === idx ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200 scale-[1.02]' : 'bg-white text-slate-400 border border-slate-100'}`}>
                                            <span className={`w-6 h-6 rounded-lg flex items-center justify-center ${q.c === idx ? 'bg-white/20' : 'bg-slate-100'}`}>
                                                {String.fromCharCode(65 + idx)}
                                            </span>
                                            {opt}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <button 
                    onClick={handlePublish}
                    disabled={isSaving || quizConfig.questions.length === 0}
                    className="mt-6 w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-[0.3em] shadow-[0_20px_50px_rgba(0,0,0,0.2)] hover:bg-blue-600 active:scale-95 transition-all duration-300 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
                >
                    {isSaving ? "Đang phát đề..." : "PHÁT ĐỀ LÊN STUDENT HUB"}
                </button>
            </div>
        </div>
    );
}
