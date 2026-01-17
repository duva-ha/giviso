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

        // Tách câu hỏi dựa trên từ khóa "Câu X:" hoặc "Câu X."
        const parts = rawText.split(/Câu\s*\d+[:.]/g).filter(p => p.trim().length > 5);
        
        const parsed = parts.map(part => {
            const lines = part.split('\n').map(l => l.trim()).filter(l => l.length > 0);
            const questionText = lines[0];
            
            // Lọc ra các dòng là đáp án (Bắt đầu bằng A, B, C, D)
            const options = lines
                .filter(l => /^[A-D][.:)]/.test(l))
                .map(l => l.replace(/^[A-D][.:)]\s*/, ""));
            
            // Tìm đáp án đúng thông qua dấu sao (*)
            let correct = 0;
            lines.forEach((l) => {
                if (l.includes('*')) {
                    const cleanOption = l.replace('*', '').replace(/^[A-D][.:)]\s*/, "").trim();
                    const foundIndex = options.findIndex(opt => opt.trim() === cleanOption);
                    if (foundIndex !== -1) correct = foundIndex;
                }
            });

            return { 
                q: questionText, 
                a: options.length > 0 ? options : ["Chưa có đáp án A", "Chưa có đáp án B", "Chưa có đáp án C", "Chưa có đáp án D"], 
                c: correct // 'c' là chỉ số đáp án đúng (0, 1, 2, 3)
            };
        });

        setQuizConfig(prev => ({ ...prev, questions: parsed }));
    }, [rawText]);

    // --- HÀM GỬI ĐỀ LÊN HỆ THỐNG ---
    const handlePublish = async () => {
        if (!quizConfig.title || quizConfig.questions.length === 0) {
            alert("Thầy vui lòng nhập tiêu đề bài thi và nội dung câu hỏi!");
            return;
        }

        setIsSaving(true);
        try {
            await db.collection("quizzes").add({
                ...quizConfig,
                time: quizConfig.time * 60, // Đổi sang giây để App HS dễ tính toán
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            alert("🚀 Đã phát đề thành công! Học sinh có thể làm bài ngay.");
            setRawText("");
            setQuizConfig(prev => ({ ...prev, title: "", questions: [] }));
        } catch (e) {
            alert("Lỗi hệ thống: " + e.message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex h-full gap-8 p-8 overflow-hidden bg-slate-50">
            {/* CỘT TRÁI: KHU VỰC SOẠN THẢO */}
            <div className="flex-1 flex flex-col gap-4">
                <div className="bg-white p-6 rounded-[2rem] border shadow-sm space-y-4">
                    <input 
                        className="w-full text-2xl font-black outline-none border-b-2 border-slate-100 focus:border-blue-600 pb-2 transition-all" 
                        placeholder="Tiêu đề bài kiểm tra..." 
                        value={quizConfig.title}
                        onChange={e => setQuizConfig({...quizConfig, title: e.target.value})}
                    />
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase text-slate-400">Khối lớp</span>
                            <select value={quizConfig.grade} onChange={e => setQuizConfig({...quizConfig, grade: e.target.value})} className="bg-slate-100 px-3 py-2 rounded-xl font-bold text-xs outline-none">
                                <option value="10">Lớp 10</option>
                                <option value="11">Lớp 11</option>
                                <option value="12">Lớp 12</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase text-slate-400">Thời gian (Phút)</span>
                            <input type="number" value={quizConfig.time} onChange={e => setQuizConfig({...quizConfig, time: parseInt(e.target.value) || 0})} className="w-20 bg-slate-100 px-3 py-2 rounded-xl font-bold text-xs outline-none" />
                        </div>
                    </div>
                </div>
                
                <textarea 
                    className="flex-1 w-full p-8 rounded-[2.5rem] border shadow-inner outline-none focus:ring-4 ring-blue-50 resize-none font-medium text-slate-600 custom-scroll"
                    placeholder={"Dán đề thi từ Word vào đây...\nCấu trúc mẫu:\nCâu 1: 1 + 1 bằng mấy?\nA. 1\nB. 2 *\nC. 3"}
                    value={rawText}
                    onChange={e => setRawText(e.target.value)}
                />
            </div>

            {/* CỘT PHẢI: BẢN XEM TRƯỚC (PREVIEW) */}
            <div className="w-[450px] flex flex-col">
                <div className="flex-1 bg-white rounded-[2.5rem] p-8 overflow-y-auto custom-scroll border-2 border-dashed border-slate-200">
                    <h3 className="text-center font-black text-[10px] uppercase text-slate-400 mb-6 tracking-[0.2em]">Bản xem trước ({quizConfig.questions.length} câu)</h3>
                    
                    {quizConfig.questions.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-300 opacity-50">
                            <span className="text-6xl mb-4">📝</span>
                            <p className="font-bold text-xs uppercase italic text-center">Nội dung đề thi sẽ xuất hiện tại đây sau khi thầy dán đề</p>
                        </div>
                    ) : (
                        quizConfig.questions.map((q, i) => (
                            <div key={i} className="bg-slate-50 p-5 rounded-3xl mb-4 border border-slate-100 preview-card shadow-sm">
                                <p className="font-bold text-slate-800 text-sm mb-3 leading-snug">{i + 1}. {q.q}</p>
                                <div className="space-y-1.5">
                                    {q.a.map((opt, idx) => (
                                        <div key={idx} className={`text-[10px] p-2.5 rounded-xl font-bold flex items-center gap-2 ${q.c === idx ? 'bg-emerald-500 text-white shadow-md' : 'bg-white text-slate-400 border border-slate-100'}`}>
                                            <span className="w-5 h-5 rounded-lg bg-black/10 flex items-center justify-center">{String.fromCharCode(65 + idx)}</span>
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
                    className="mt-6 w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-blue-600 active:scale-95 transition-all disabled:bg-slate-200 disabled:text-slate-400"
                >
                    {isSaving ? "ĐANG LƯU..." : "PHÁT ĐỀ LÊN STUDENT HUB"}
                </button>
            </div>
        </div>
    );
}
