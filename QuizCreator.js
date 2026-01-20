const { useState, useEffect } = React;

const QuizCreator = ({ db, firebase }) => {
    const [quizTitle, setQuizTitle] = useState("");
    const [grade, setGrade] = useState("10");
    const [time, setTime] = useState(15);
    const [rawText, setRawText] = useState("");
    const [history, setHistory] = useState([]); // Danh sách đề đã lưu
    const [view, setView] = useState("create"); // 'create' hoặc 'history'

    // 1. Lấy lịch sử đề thi từ Firebase
    useEffect(() => {
        const unsub = db.collection("quizzes_history")
            .orderBy("createdAt", "desc")
            .onSnapshot(s => {
                setHistory(s.docs.map(d => ({ id: d.id, ...d.data() })));
            });
        return () => unsub();
    }, []);

    // 2. Hàm phân tích văn bản thành mảng câu hỏi
    const parseQuestions = (text) => {
        const parts = text.split(/Câu\s*\d+[:.]/i).filter(p => p.trim());
        return parts.map(p => {
            const lines = p.trim().split('\n');
            const qText = lines[0].trim();
            const options = lines.slice(1).map(l => l.replace(/^[A-D][:.]\s*/i, '').trim());
            const correctLine = lines.find(l => l.startsWith('*'));
            const correctIdx = lines.slice(1).indexOf(correctLine);
            return { q: qText, a: options.map(o => o.replace('*', '')), c: correctIdx };
        });
    };

    // 3. Hàm phát đề và lưu vào lịch sử
    const handlePublish = async () => {
        const questions = parseQuestions(rawText);
        if (!quizTitle || questions.length === 0) return alert("Vui lòng nhập đủ tên đề và nội dung!");

        const quizData = {
            title: quizTitle,
            grade: grade,
            time: parseInt(time) * 60,
            questions: questions,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        try {
            // Phát lên Live cho học sinh
            await db.collection("live_quizzes").doc(grade).set(quizData);
            // Lưu vào kho lưu trữ cá nhân của thầy
            await db.collection("quizzes_history").add(quizData);
            
            alert("🚀 Đã phát đề thành công!");
            setRawText(""); setQuizTitle("");
        } catch (e) { alert("Lỗi hệ thống!"); }
    };

    return (
        <div className="flex flex-col h-full bg-slate-50">
            {/* THANH ĐIỀU HƯỚNG TAB CON */}
            <div className="flex gap-4 p-6 bg-white border-b shadow-sm">
                <button 
                    onClick={() => setView("create")}
                    className={`px-6 py-2 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${view === 'create' ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}
                >
                    ✨ Soạn đề mới
                </button>
                <button 
                    onClick={() => setView("history")}
                    className={`px-6 py-2 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${view === 'history' ? 'bg-orange-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}
                >
                    📚 Kho đề đã lưu ({history.length})
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
                {view === "create" ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
                        {/* BÊN TRÁI: KHU VỰC NHẬP LIỆU */}
                        <div className="space-y-6">
                            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                                <input 
                                    placeholder="Tên bài kiểm tra..." 
                                    className="w-full text-2xl font-black text-slate-800 outline-none mb-6 border-b-2 border-slate-50 focus:border-blue-500 pb-2 transition-all"
                                    value={quizTitle} onChange={e => setQuizTitle(e.target.value)}
                                />
                                <div className="flex gap-4 mb-6">
                                    <select value={grade} onChange={e => setGrade(e.target.value)} className="bg-slate-50 px-4 py-2 rounded-xl font-bold text-blue-600 outline-none">
                                        <option value="10">Khối 10</option><option value="11">Khối 11</option><option value="12">Khối 12</option>
                                    </select>
                                    <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl">
                                        <span className="text-xs font-bold text-slate-400">THỜI GIAN:</span>
                                        <input type="number" value={time} onChange={e => setTime(e.target.value)} className="w-12 bg-transparent font-black text-blue-600 outline-none text-center"/>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Phút</span>
                                    </div>
                                </div>
                                <textarea 
                                    placeholder="Ví dụ:&#10;Câu 1: Thủ đô Việt Nam?&#10;*A. Hà Nội&#10;B. Đà Nẵng"
                                    className="w-full h-80 bg-slate-50 p-6 rounded-3xl text-sm font-medium text-slate-600 outline-none border-2 border-transparent focus:border-blue-100 transition-all resize-none"
                                    value={rawText} onChange={e => setRawText(e.target.value)}
                                />
                                <button 
                                    onClick={handlePublish}
                                    className="w-full mt-6 bg-slate-900 text-white py-5 rounded-[2rem] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl active:scale-95"
                                >
                                    🚀 Phát đề lên Student Hub
                                </button>
                            </div>
                        </div>

                        {/* BÊN PHẢI: XEM TRƯỚC TỨC THỜI */}
                        <div className="bg-white p-8 rounded-[2.5rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
                            {rawText ? (
                                <div className="w-full text-left space-y-4 overflow-y-auto max-h-[600px] px-2">
                                    <h3 className="font-black text-slate-400 uppercase text-[10px] tracking-[0.2em] mb-4">Bản xem trước ({parseQuestions(rawText).length} câu)</h3>
                                    {parseQuestions(rawText).map((q, i) => (
                                        <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                            <div className="font-bold text-slate-800 text-sm mb-2">{i+1}. {q.q}</div>
                                            <div className="grid grid-cols-2 gap-2">
                                                {q.a.map((opt, idx) => (
                                                    <div key={idx} className={`text-[10px] p-2 rounded-lg font-bold ${idx === q.c ? 'bg-green-100 text-green-700' : 'bg-white text-slate-400'}`}>
                                                        {String.fromCharCode(65+idx)}. {opt}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <>
                                    <div className="text-5xl mb-4">✍️</div>
                                    <p className="text-slate-400 font-bold italic text-sm">Đang đợi nội dung soạn thảo...</p>
                                </>
                            )}
                        </div>
                    </div>
                ) : (
                    /* KHO ĐỀ ĐÃ LƯU */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
                        {history.map((q, i) => (
                            <div key={i} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-md transition-all group">
                                <div className="flex justify-between items-start mb-4">
                                    <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[9px] font-black uppercase">Khối {q.grade}</span>
                                    <span className="text-[9px] font-bold text-slate-300 italic">{q.createdAt?.toDate().toLocaleDateString('vi-VN')}</span>
                                </div>
                                <h4 className="font-black text-slate-700 mb-4 line-clamp-2 uppercase text-xs leading-relaxed">{q.title}</h4>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => { setQuizTitle(q.title); setRawText(q.questions.map((c,idx) => `Câu ${idx+1}: ${c.q}\n${c.a.map((opt,oidx) => (oidx === c.c ? '*' : '') + String.fromCharCode(65+oidx) + '. ' + opt).join('\n')}`).join('\n\n')); setView('create'); }}
                                        className="flex-1 bg-slate-50 text-slate-500 py-2 rounded-xl font-bold text-[10px] hover:bg-blue-50 hover:text-blue-600 transition-all"
                                    >
                                        Sửa đề
                                    </button>
                                    <button 
                                        onClick={async () => { await db.collection("live_quizzes").doc(q.grade).set(q); alert("🚀 Đã tái phát đề!"); }}
                                        className="flex-1 bg-slate-900 text-white py-2 rounded-xl font-black text-[10px] hover:bg-green-600 transition-all"
                                    >
                                        Phát lại
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
