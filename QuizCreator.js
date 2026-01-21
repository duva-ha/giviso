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
        const unsub = db.collection("quizzes_history")
            .orderBy("createdAt", "desc")
            .onSnapshot(s => {
                setHistory(s.docs.map(d => ({ id: d.id, ...d.data() })));
            });
        return () => unsub();
    }, []);

    const handleWordImport = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(event) {
            const arrayBuffer = event.target.result;
            const options = { styleMap: [ "u => strong" ] };
            mammoth.convertToHtml({ arrayBuffer: arrayBuffer }, options)
                .then(result => {
                    let html = result.value;
                    html = html.replace(/<strong>(.*?)<\/strong>/g, "*$1");
                    const tempDiv = document.createElement("div");
                    tempDiv.innerHTML = html;
                    setRawText(tempDiv.innerText || tempDiv.textContent);
                    alert("✅ Nhập file Word thành công!");
                })
                .catch(err => alert("❌ Lỗi: " + err));
        };
        reader.readAsArrayBuffer(file);
    };

    const parseQuestions = (text) => {
        if (!text) return [];
        const parts = text.split(/Câu\s*\d+[:.]/i).filter(p => p.trim());
        return parts.map(p => {
            const lines = p.trim().split('\n').filter(l => l.trim());
            const qText = lines[0]?.trim();
            const options = lines.slice(1).filter(l => /^[A-D][:.]\s*/i.test(l.trim()) || l.includes('*'));
            const correctIdx = options.findIndex(l => l.includes('*'));
            return { 
                q: qText, 
                a: options.map(o => o.replace(/^[A-D][:.]\s*/i, '').replace(/\*/g, '').trim()), 
                c: correctIdx 
            };
        });
    };

    const handlePublish = async () => {
        const questions = parseQuestions(rawText);
        if (!quizTitle || questions.length === 0) return alert("Thiếu tên đề hoặc câu hỏi!");
        const quizData = {
            title: quizTitle, grade, time: parseInt(time) * 60,
            questions, isLive: true,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        try {
            await db.collection("live_quizzes").doc(grade).set(quizData);
            await db.collection("quizzes_history").add(quizData);
            alert("🚀 ĐỀ ĐÃ PHÁT THÀNH CÔNG!");
            setRawText(""); setQuizTitle("");
        } catch (e) { alert("Lỗi: " + e.message); }
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
            {/* THANH ĐIỀU HƯỚNG TỐI ƯU MOBILE */}
            <div className="flex flex-col sm:flex-row justify-between items-center p-4 lg:p-6 bg-white border-b gap-4">
                <div className="flex bg-slate-100 p-1 rounded-2xl w-full sm:w-auto">
                    <button onClick={() => setView("create")} className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${view === 'create' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>Soạn đề</button>
                    <button onClick={() => setView("history")} className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${view === 'history' ? 'bg-white text-orange-500 shadow-sm' : 'text-slate-400'}`}>Kho đề</button>
                </div>

                {view === "create" && (
                    <div className="w-full sm:w-auto">
                        <input type="file" ref={fileInputRef} onChange={handleWordImport} accept=".docx" className="hidden" />
                        <button onClick={() => fileInputRef.current.click()} className="w-full bg-emerald-600 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-100 flex justify-center items-center gap-2">
                            📥 Nhập Word
                        </button>
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 lg:p-8">
                {view === "create" ? (
                    <div className="flex flex-col lg:flex-row gap-6 lg:gap-10 max-w-7xl mx-auto">
                        {/* CỘT 1: NHẬP LIỆU */}
                        <div className="w-full lg:w-1/2 bg-white p-6 lg:p-10 rounded-[2.5rem] shadow-xl border border-slate-100">
                            <input placeholder="Tên bài kiểm tra..." className="w-full text-xl lg:text-2xl font-black mb-6 outline-none border-b-4 border-slate-50 focus:border-blue-500 pb-2" value={quizTitle} onChange={e => setQuizTitle(e.target.value)} />
                            
                            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                                <div className="flex-1 bg-slate-50 p-4 rounded-2xl">
                                    <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Khối</label>
                                    <select value={grade} onChange={e => setGrade(e.target.value)} className="w-full bg-transparent font-bold text-blue-600 outline-none">
                                        <option value="10">Lớp 10</option><option value="11">Lớp 11</option><option value="12">Lớp 12</option>
                                    </select>
                                </div>
                                <div className="flex-1 bg-slate-50 p-4 rounded-2xl">
                                    <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Phút</label>
                                    <input type="number" value={time} onChange={e => setTime(e.target.value)} className="w-full bg-transparent font-black text-blue-600 outline-none" />
                                </div>
                            </div>

                            <textarea 
                                placeholder="Câu 1: ...&#10;*A. Đáp án đúng&#10;B. Đáp án sai" 
                                className="w-full h-[350px] lg:h-[450px] bg-slate-50 p-6 rounded-[2rem] text-base font-medium outline-none focus:bg-white border-2 border-transparent focus:border-blue-100 transition-all resize-none" 
                                value={rawText} onChange={e => setRawText(e.target.value)} 
                            />
                            
                            <button onClick={handlePublish} className="w-full mt-6 bg-slate-900 text-white py-5 rounded-[1.5rem] font-black uppercase tracking-widest shadow-2xl active:scale-95 transition-all">
                                🚀 PHÁT ĐỀ NGAY
                            </button>
                        </div>

                        {/* CỘT 2: XEM TRƯỚC (Ẩn bớt Padding trên Mobile) */}
                        <div className="w-full lg:w-1/2 bg-slate-100/50 rounded-[2.5rem] p-4 lg:p-10 border-4 border-dashed border-white overflow-y-visible">
                            <h3 className="font-black text-slate-400 uppercase text-[10px] tracking-widest mb-6 flex items-center gap-2 px-2">
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-ping"></span> Xem trước
                            </h3>
                            <div className="space-y-4">
                                {parseQuestions(rawText).map((q, i) => (
                                    <div key={i} className="bg-white p-5 rounded-[2rem] shadow-sm">
                                        <div className="font-black text-slate-800 mb-4 text-sm leading-tight">{i+1}. {q.q}</div>
                                        <div className="grid grid-cols-1 gap-2">
                                            {q.a.map((opt, idx) => (
                                                <div key={idx} className={`p-3 rounded-xl text-[10px] font-bold border ${idx === q.c ? 'bg-green-50 border-green-200 text-green-700' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                                                    {String.fromCharCode(65+idx)}. {opt}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    /* KHO ĐỀ: Hiển thị Grid linh hoạt */
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-8 max-w-7xl mx-auto">
                        {history.map((h, i) => (
                            <div key={i} className="bg-white p-6 rounded-[2rem] shadow-lg border border-slate-50">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-[9px] font-black uppercase">Lớp {h.grade}</span>
                                    <span className="text-[9px] font-bold text-slate-300">{h.createdAt?.toDate().toLocaleDateString('vi-VN')}</span>
                                </div>
                                <h4 className="font-black text-slate-800 text-xs mb-6 uppercase line-clamp-2 h-8">{h.title}</h4>
                                <div className="flex gap-2 mt-auto">
                                    <button 
                                        onClick={() => {
                                            setQuizTitle(h.title); setGrade(h.grade);
                                            const reconstructed = h.questions.map((q, idx) => {
                                                let qStr = `Câu ${idx+1}: ${q.q}\n`;
                                                q.a.forEach((opt, oIdx) => { qStr += `${oIdx === q.c ? '*' : ''}${String.fromCharCode(65+oIdx)}. ${opt}\n`; });
                                                return qStr;
                                            }).join('\n');
                                            setRawText(reconstructed); setView('create');
                                        }}
                                        className="flex-1 py-3 bg-slate-50 text-slate-400 rounded-xl font-black text-[9px] uppercase hover:bg-blue-600 hover:text-white transition-all"
                                    >Sửa</button>
                                    <button 
                                        onClick={async () => {
                                            if(confirm(`Phát lại đề này?`)) {
                                                await db.collection("live_quizzes").doc(h.grade).set({...h, createdAt: firebase.firestore.FieldValue.serverTimestamp()});
                                                alert("🚀 Đã phát lại!");
                                            }
                                        }}
                                        className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-black text-[9px] uppercase shadow-lg"
                                    >Phát</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
