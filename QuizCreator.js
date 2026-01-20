const { useState, useEffect, useRef } = React;

const QuizCreator = ({ db, firebase }) => {
    const [quizTitle, setQuizTitle] = useState("");
    const [grade, setGrade] = useState("10");
    const [time, setTime] = useState(15);
    const [rawText, setRawText] = useState("");
    const [history, setHistory] = useState([]);
    const [view, setView] = useState("create"); // 'create' hoặc 'history'
    const fileInputRef = useRef(null);

    // 1. Tải lịch sử đề thi từ Firebase
    useEffect(() => {
        const unsub = db.collection("quizzes_history")
            .orderBy("createdAt", "desc")
            .onSnapshot(s => {
                setHistory(s.docs.map(d => ({ id: d.id, ...d.data() })));
            });
        return () => unsub();
    }, []);

    // 2. Xử lý nhập đề từ file Word (Hỗ trợ Gạch chân & Dấu *)
    const handleWordImport = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(event) {
            const arrayBuffer = event.target.result;
            
            // Mammoth chuyển đổi: Ưu tiên nhận diện gạch chân (u)
            const options = {
                styleMap: [ "u => strong" ] // Chuyển gạch chân thành thẻ mạnh để dễ bóc tách
            };

            mammoth.convertToHtml({ arrayBuffer: arrayBuffer }, options)
                .then(result => {
                    let html = result.value;
                    // Chuyển nội dung gạch chân (strong) thành dấu *
                    html = html.replace(/<strong>(.*?)<\/strong>/g, "*$1");
                    
                    // Lấy văn bản thô sạch
                    const tempDiv = document.createElement("div");
                    tempDiv.innerHTML = html;
                    let text = tempDiv.innerText || tempDiv.textContent;

                    setRawText(text);
                    alert("✅ Nhập file Word thành công! Hệ thống đã nhận diện các đáp án gạch chân.");
                })
                .catch(err => alert("❌ Lỗi đọc file Word: " + err));
        };
        reader.readAsArrayBuffer(file);
    };

    // 3. Hàm "Bộ não" - Phân tích văn bản thành mảng câu hỏi
    const parseQuestions = (text) => {
        if (!text) return [];
        // Tách theo "Câu X:" hoặc "Câu X."
        const parts = text.split(/Câu\s*\d+[:.]/i).filter(p => p.trim());
        
        return parts.map(p => {
            const lines = p.trim().split('\n').filter(l => l.trim());
            const qText = lines[0]?.trim();
            
            // Tìm các dòng là đáp án (Bắt đầu bằng A,B,C,D hoặc chứa dấu *)
            const options = lines.slice(1).filter(l => 
                /^[A-D][:.]\s*/i.test(l.trim()) || l.includes('*')
            );
            
            const correctIdx = options.findIndex(l => l.includes('*'));
            
            return { 
                q: qText, 
                a: options.map(o => o.replace(/^[A-D][:.]\s*/i, '').replace(/\*/g, '').trim()), 
                c: correctIdx 
            };
        });
    };

    // 4. Phát đề và lưu lịch sử
    const handlePublish = async () => {
        const questions = parseQuestions(rawText);
        if (!quizTitle || questions.length === 0) return alert("Vui lòng nhập tên đề và nội dung câu hỏi!");

        const quizData = {
            title: quizTitle,
            grade: grade,
            time: parseInt(time) * 60,
            questions: questions,
            isLive: true,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        try {
            // Phát lên cho học sinh thấy
            await db.collection("live_quizzes").doc(grade).set(quizData);
            // Lưu vào kho lưu trữ của thầy
            await db.collection("quizzes_history").add(quizData);
            
            alert("🚀 ĐỀ ĐÃ ĐƯỢC PHÁT LÊN HỆ THỐNG!");
            setRawText(""); setQuizTitle("");
        } catch (e) { alert("Lỗi hệ thống: " + e.message); }
    };

    return (
        <div className="flex flex-col h-full bg-slate-50">
            {/* THANH TAB & NHẬP FILE */}
            <div className="flex justify-between items-center p-6 bg-white border-b shadow-sm">
                <div className="flex gap-3">
                    <button onClick={() => setView("create")} className={`px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${view === 'create' ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-slate-100 text-slate-400'}`}>✨ Soạn đề mới</button>
                    <button onClick={() => setView("history")} className={`px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${view === 'history' ? 'bg-orange-500 text-white shadow-lg shadow-orange-100' : 'bg-slate-100 text-slate-400'}`}>📚 Kho lưu trữ ({history.length})</button>
                </div>

                {view === "create" && (
                    <div>
                        <input type="file" ref={fileInputRef} onChange={handleWordImport} accept=".docx" className="hidden" />
                        <button onClick={() => fileInputRef.current.click()} className="bg-emerald-50 text-emerald-600 border-2 border-emerald-100 px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all flex items-center gap-2">
                            📥 Nhập từ file Word
                        </button>
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-y-auto p-8">
                {view === "create" ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 max-w-7xl mx-auto">
                        {/* KHU VỰC NHẬP LIỆU */}
                        <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100">
                            <input placeholder="Nhập tên bài kiểm tra..." className="w-full text-2xl font-black mb-6 outline-none border-b-4 border-slate-50 focus:border-blue-500 pb-2 transition-all" value={quizTitle} onChange={e => setQuizTitle(e.target.value)} />
                            
                            <div className="flex gap-4 mb-8">
                                <div className="flex-1 bg-slate-50 p-4 rounded-2xl">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Khối lớp</label>
                                    <select value={grade} onChange={e => setGrade(e.target.value)} className="w-full bg-transparent font-bold text-blue-600 outline-none">
                                        <option value="10">Lớp 10</option><option value="11">Lớp 11</option><option value="12">Lớp 12</option>
                                    </select>
                                </div>
                                <div className="flex-1 bg-slate-50 p-4 rounded-2xl">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Thời gian (Phút)</label>
                                    <input type="number" value={time} onChange={e => setTime(e.target.value)} className="w-full bg-transparent font-black text-blue-600 outline-none" />
                                </div>
                            </div>

                            <textarea 
                                placeholder="Dán nội dung hoặc nhập đề tại đây...&#10;Câu 1: Thủ đô VN là gì?&#10;*A. Hà Nội&#10;B. Đà Nẵng" 
                                className="w-full h-[400px] bg-slate-50 p-8 rounded-[2rem] text-sm font-medium outline-none focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all border-none resize-none scrollbar-hide" 
                                value={rawText} onChange={e => setRawText(e.target.value)} 
                            />
                            
                            <button onClick={handlePublish} className="w-full mt-8 bg-slate-900 text-white py-6 rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-blue-600 transition-all active:scale-95">
                                🚀 PHÁT ĐỀ TỚI HỌC SINH
                            </button>
                        </div>

                        {/* KHU VỰC XEM TRƯỚC (PREVIEW) */}
                        <div className="bg-white/50 rounded-[3rem] p-10 border-4 border-dashed border-white overflow-y-auto max-h-[850px]">
                            <h3 className="font-black text-slate-400 uppercase text-[10px] tracking-widest mb-6 flex items-center gap-2">
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-ping"></span> Xem trước trực tiếp
                            </h3>
                            {parseQuestions(rawText).length > 0 ? (
                                parseQuestions(rawText).map((q, i) => (
                                    <div key={i} className="mb-6 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
                                        <div className="font-black text-slate-800 mb-4 text-sm leading-relaxed">{i+1}. {q.q}</div>
                                        <div className="space-y-2">
                                            {q.a.map((opt, idx) => (
                                                <div key={idx} className={`p-4 rounded-xl text-[11px] font-bold border-2 transition-all ${idx === q.c ? 'bg-green-50 border-green-200 text-green-700' : 'bg-slate-50 border-transparent text-slate-400'}`}>
                                                    <span className="mr-2">{String.fromCharCode(65+idx)}.</span> {opt}
                                                    {idx === q.c && <span className="float-right text-green-500">✔</span>}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-300 italic py-20">
                                    <div className="text-6xl mb-4">📝</div>
                                    <p>Nội dung đề sẽ hiển thị tại đây...</p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    /* KHO ĐỀ ĐÃ LƯU */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                        {history.map((h, i) => (
                            <div key={i} className="bg-white p-8 rounded-[2.5rem] shadow-lg border border-slate-100 hover:-translate-y-2 transition-all group">
                                <div className="flex justify-between items-start mb-6">
                                    <span className="bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full text-[10px] font-black uppercase">Khối {h.grade}</span>
                                    <span className="text-[10px] font-bold text-slate-300">{h.createdAt?.toDate().toLocaleDateString('vi-VN')}</span>
                                </div>
                                <h4 className="font-black text-slate-800 text-sm mb-6 uppercase leading-tight line-clamp-3 h-12">{h.title}</h4>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => {
                                            setQuizTitle(h.title);
                                            setGrade(h.grade);
                                            // Tự động dựng lại rawText từ mảng questions
                                            const reconstructed = h.questions.map((q, idx) => {
                                                let qStr = `Câu ${idx+1}: ${q.q}\n`;
                                                q.a.forEach((opt, oIdx) => {
                                                    qStr += `${oIdx === q.c ? '*' : ''}${String.fromCharCode(65+oIdx)}. ${opt}\n`;
                                                });
                                                return qStr;
                                            }).join('\n');
                                            setRawText(reconstructed);
                                            setView('create');
                                        }}
                                        className="flex-1 py-3 bg-slate-100 text-slate-500 rounded-2xl font-black text-[10px] uppercase hover:bg-blue-600 hover:text-white transition-all"
                                    >
                                        Sửa đề
                                    </button>
                                    <button 
                                        onClick={async () => {
                                            if(confirm(`Phát lại đề "${h.title}" cho Khối ${h.grade}?`)) {
                                                await db.collection("live_quizzes").doc(h.grade).set({...h, createdAt: firebase.firestore.FieldValue.serverTimestamp()});
                                                alert("🚀 Đã tái phát đề thành công!");
                                            }
                                        }}
                                        className="flex-1 py-3 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase hover:bg-green-600 transition-all"
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
