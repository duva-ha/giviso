const { useState, useEffect, useRef } = React;

const QuizCreator = ({ db, firebase }) => {
    const [quizTitle, setQuizTitle] = useState("");
    const [grade, setGrade] = useState("10");
    const [time, setTime] = useState(15);
    const [rawText, setRawText] = useState("");
    const [history, setHistory] = useState([]);
    const [view, setView] = useState("create");
    const fileInputRef = useRef(null);

    useEffect(() => {
        const unsub = db.collection("quizzes_history").orderBy("createdAt", "desc").onSnapshot(s => {
            setHistory(s.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        return () => unsub();
    }, []);

    // --- LOGIC XỬ LÝ FILE WORD ---
    const handleWordImport = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(event) {
            const arrayBuffer = event.target.result;
            // Dùng thư viện mammoth để đọc nội dung file Word
            mammoth.extractRawText({ arrayBuffer: arrayBuffer })
                .then(result => {
                    const text = result.value;
                    setRawText(text); // Đổ toàn bộ văn bản từ Word vào khung soạn thảo
                    alert("✅ Đã nhập nội dung từ file Word thành công!");
                })
                .catch(err => alert("❌ Lỗi khi đọc file Word: " + err));
        };
        reader.readAsArrayBuffer(file);
    };

    const parseQuestions = (text) => {
        if (!text) return [];
        const parts = text.split(/Câu\s*\d+[:.]/i).filter(p => p.trim());
        return parts.map(p => {
            const lines = p.trim().split('\n').filter(l => l.trim());
            const qText = lines[0]?.trim();
            const options = lines.slice(1).filter(l => /^[A-D][:.]/i.test(l) || l.startsWith('*'));
            const correctIdx = options.findIndex(l => l.includes('*'));
            return { 
                q: qText, 
                a: options.map(o => o.replace(/^[A-D][:.]\s*/i, '').replace('*', '').trim()), 
                c: correctIdx 
            };
        });
    };

    const handlePublish = async () => {
        const questions = parseQuestions(rawText);
        if (!quizTitle || questions.length === 0) return alert("Vui lòng nhập đủ thông tin!");

        const quizData = {
            title: quizTitle,
            grade: grade,
            time: parseInt(time) * 60,
            questions: questions,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        try {
            await db.collection("live_quizzes").doc(grade).set(quizData);
            await db.collection("quizzes_history").add(quizData);
            alert("🚀 Đã phát đề lên hệ thống!");
            setRawText(""); setQuizTitle("");
        } catch (e) { alert("Lỗi khi phát đề!"); }
    };

    return (
        <div className="flex flex-col h-full bg-slate-50">
            <div className="flex justify-between items-center p-6 bg-white border-b shadow-sm">
                <div className="flex gap-4">
                    <button onClick={() => setView("create")} className={`px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${view === 'create' ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-slate-100 text-slate-400'}`}>✨ Soạn đề</button>
                    <button onClick={() => setView("history")} className={`px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${view === 'history' ? 'bg-orange-500 text-white shadow-lg shadow-orange-100' : 'bg-slate-100 text-slate-400'}`}>📚 Kho đề ({history.length})</button>
                </div>

                {/* NÚT TẢI FILE WORD */}
                {view === "create" && (
                    <div>
                        <input type="file" ref={fileInputRef} onChange={handleWordImport} accept=".docx" className="hidden" />
                        <button 
                            onClick={() => fileInputRef.current.click()}
                            className="bg-indigo-50 text-indigo-600 px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest border-2 border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all flex items-center gap-2"
                        >
                            📄 Nhập từ file Word
                        </button>
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-y-auto p-8">
                {view === "create" ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 max-w-7xl mx-auto">
                        <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100">
                            <input placeholder="Tên đề kiểm tra..." className="w-full text-2xl font-black mb-6 outline-none border-b-2 border-slate-50 focus:border-blue-500 pb-2" value={quizTitle} onChange={e => setQuizTitle(e.target.value)} />
                            <div className="flex gap-4 mb-6">
                                <select value={grade} onChange={e => setGrade(e.target.value)} className="bg-slate-50 px-6 py-3 rounded-2xl font-bold text-blue-600 outline-none border-2 border-transparent focus:border-blue-100">
                                    <option value="10">Khối 10</option><option value="11">Khối 11</option><option value="12">Khối 12</option>
                                </select>
                                <input type="number" value={time} onChange={e => setTime(e.target.value)} className="w-24 bg-slate-50 px-6 py-3 rounded-2xl font-black text-blue-600 outline-none text-center" />
                                <span className="flex items-center text-[10px] font-black text-slate-400 uppercase italic">Phút</span>
                            </div>
                            <textarea placeholder="Nội dung đề bài..." className="w-full h-96 bg-slate-50 p-8 rounded-[2rem] text-sm font-medium outline-none focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all border-none" value={rawText} onChange={e => setRawText(e.target.value)} />
                            <button onClick={handlePublish} className="w-full mt-8 bg-slate-900 text-white py-6 rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-blue-600 transition-all active:scale-95">🚀 PHÁT ĐỀ NGAY</button>
                        </div>

                        {/* PREVIEW */}
                        <div className="bg-slate-100/50 rounded-[3rem] p-10 border-4 border-dashed border-white overflow-y-auto max-h-[800px]">
                            <h3 className="font-black text-slate-400 uppercase text-[10px] tracking-widest mb-6">Bản xem trước trực tiếp</h3>
                            {parseQuestions(rawText).map((q, i) => (
                                <div key={i} className="mb-6 bg-white p-6 rounded-3xl shadow-sm">
                                    <div className="font-bold text-slate-800 mb-4">{i+1}. {q.q}</div>
                                    <div className="grid grid-cols-1 gap-2">
                                        {q.a.map((opt, idx) => (
                                            <div key={idx} className={`p-3 rounded-xl text-xs font-bold ${idx === q.c ? 'bg-green-500 text-white' : 'bg-slate-50 text-slate-500'}`}>
                                                {String.fromCharCode(65+idx)}. {opt}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    /* KHO ĐỀ (Thầy có thể thêm nút Xóa ở đây) */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {history.map((h, i) => (
                            <div key={i} className="bg-white p-8 rounded-[2.5rem] shadow-lg border border-slate-100 hover:scale-[1.02] transition-all">
                                <div className="text-[10px] font-black text-blue-500 uppercase mb-2">Khối {h.grade} • {h.questions.length} Câu</div>
                                <h4 className="font-black text-slate-800 text-sm mb-6 uppercase leading-tight line-clamp-2">{h.title}</h4>
                                <button onClick={() => {setQuizTitle(h.title); setView('create'); /* Thêm logic đổ questions về rawText nếu muốn */}} className="w-full py-3 bg-slate-100 text-slate-500 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all">Sử dụng lại</button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
