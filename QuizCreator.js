const { useState, useEffect, useRef } = React;

const QuizCreator = ({ db, firebase, results = [] }) => {
    const [quizTitle, setQuizTitle] = useState("");
    const [grade, setGrade] = useState("10");
    const [time, setTime] = useState(15);
    const [rawText, setRawText] = useState("");
    const [history, setHistory] = useState([]);
    const [view, setView] = useState("create");
    const fileInputRef = useRef(null);

    // --- STATE MỚI: THÔNG TIN TRƯỜNG LỚP ĐỂ XUẤT FILE ---
    const [showExportModal, setShowExportModal] = useState(null); // Lưu đề đang chờ xuất
    const [exportInfo, setExportInfo] = useState({
        school: "TRƯỜNG THPT ....................",
        department: "TỔ CÔNG NGHỆ",
        year: "Năm học: 2025 - 2026",
        examName: "KIỂM TRA ĐỊNH KỲ",
    });

    // --- HELPER: HÀM XÁO TRỘN MẢNG ---
    const shuffleArray = (array) => {
        const newArr = [...array];
        for (let i = newArr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
        }
        return newArr;
    };

    // --- LOGIC XUẤT ZIP (CẬP NHẬT HEADER TRƯỜNG LỚP) ---
    const handleExportZip = async (quiz) => {
        const zip = new JSZip();
        const totalVersions = 4;
        const allAnswers = [];
        const folderName = `Bo_De_${quiz.title.replace(/\s+/g, '_')}`;
        const folder = zip.folder(folderName);

        alert("⏳ Hệ thống đang trộn đề và tạo file ZIP, thầy đợi chút nhé...");

        for (let i = 1; i <= totalVersions; i++) {
            const examCode = 100 + i;
            let shuffledQs = shuffleArray(quiz.questions);
            const readyData = shuffledQs.map(item => {
                let options = (item.a || item.o || []).map((text, idx) => ({
                    text, isCorrect: idx === item.c
                }));
                options = shuffleArray(options);
                return {
                    q: item.q,
                    options: options.map(o => o.text),
                    correctLetter: String.fromCharCode(65 + options.findIndex(o => o.isCorrect))
                };
            });

            readyData.forEach((q, qIdx) => {
                allAnswers.push({
                    "Mã đề": examCode,
                    "Câu số": qIdx + 1,
                    "Đáp án đúng": q.correctLetter
                });
            });

            const doc = new docx.Document({
                sections: [{
                    children: [
                        // HEADER TRƯỜNG VÀ KỲ THI (Lấy từ exportInfo)
                        new docx.Paragraph({
                            children: [
                                new docx.TextRun({ text: exportInfo.school.toUpperCase(), bold: true }),
                                new docx.TextRun({ text: "\t\t\t\t" + exportInfo.examName.toUpperCase(), bold: true }),
                            ],
                            alignment: docx.AlignmentType.LEFT,
                        }),
                        new docx.Paragraph({
                            children: [
                                new docx.TextRun({ text: exportInfo.department.toUpperCase() }),
                                new docx.TextRun({ text: "\t\t\t\t\t" + exportInfo.year }),
                            ],
                            alignment: docx.AlignmentType.LEFT,
                        }),
                        new docx.Paragraph({ text: "-----------------------", alignment: docx.AlignmentType.LEFT, spacing: { after: 300 } }),

                        new docx.Paragraph({ 
                            text: `BÀI KIỂM TRA: ${quiz.title.toUpperCase()}`, 
                            heading: docx.HeadingLevel.HEADING_1, 
                            alignment: docx.AlignmentType.CENTER 
                        }),
                        new docx.Paragraph({ 
                            text: `Mã đề: ${examCode}`, 
                            alignment: docx.AlignmentType.CENTER,
                            spacing: { after: 300 }
                        }),
                        new docx.Paragraph({ text: "Họ và tên:...................................................... Lớp:..........", spacing: { after: 300 } }),
                        ...readyData.flatMap((q, idx) => [
                            new docx.Paragraph({ 
                                text: `Câu ${idx + 1}: ${q.q}`, 
                                spacing: { before: 200 },
                                style: "normal"
                            }),
                            new docx.Paragraph({ 
                                text: q.options.map((opt, oIdx) => `${String.fromCharCode(65+oIdx)}. ${opt}`).join("       ") 
                            })
                        ])
                    ],
                }],
            });

            const docBlob = await docx.Packer.toBlob(doc);
            folder.file(`De_Thi_Ma_${examCode}.docx`, docBlob);
        }

        const ws = XLSX.utils.json_to_sheet(allAnswers);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "DapAn");
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        folder.file("Ma_Tran_Dap_An_Chuan.xlsx", excelBuffer);

        const content = await zip.generateAsync({ type: "blob" });
        saveAs(content, `GIVISO_PRO_${quiz.title.replace(/\s+/g, '_')}.zip`);
        alert("🚀 Xuất ZIP thành công!");
    };

    // 1. TẢI LỊCH SỬ ĐỀ
    useEffect(() => {
        const unsub = db.collection("quizzes_history")
            .orderBy("createdAt", "desc")
            .onSnapshot(s => {
                setHistory(s.docs.map(d => ({ id: d.id, ...d.data() })));
            });
        return () => unsub();
    }, []);

    // 2. NHẬP WORD
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

    // 3. LOGIC PHÂN TÍCH
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

    // 4. PHÁT ĐỀ
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

    const handleDelete = async (id, title) => {
        if (confirm(`Thầy có chắc muốn xóa vĩnh viễn đề: "${title}"?`)) {
            try {
                await db.collection("quizzes_history").doc(id).delete();
                alert("🗑️ Đã xóa đề khỏi kho lưu trữ.");
            } catch (e) { alert("Lỗi khi xóa: " + e.message); }
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 overflow-hidden text-left relative">
            {/* THANH ĐIỀU HƯỚNG */}
            <div className="flex flex-col sm:flex-row justify-between items-center p-4 lg:p-6 bg-white border-b gap-4">
                <div className="flex bg-slate-100 p-1 rounded-2xl w-full sm:w-auto font-black">
                    <button onClick={() => setView("create")} className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-[10px] uppercase tracking-widest transition-all ${view === 'create' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>Soạn đề</button>
                    <button onClick={() => setView("history")} className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-[10px] uppercase tracking-widest transition-all ${view === 'history' ? 'bg-white text-orange-500 shadow-sm' : 'text-slate-400'}`}>Kho đề</button>
                </div>
                {view === "create" && (
                    <div className="w-full sm:w-auto">
                        <input type="file" ref={fileInputRef} onChange={handleWordImport} accept=".docx" className="hidden" />
                        <button onClick={() => fileInputRef.current.click()} className="w-full bg-emerald-600 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex justify-center items-center gap-2">📥 Nhập Word</button>
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 lg:p-8">
                {view === "create" ? (
                    <div className="flex flex-col lg:flex-row gap-6 lg:gap-10 max-w-7xl mx-auto">
                        <div className="w-full lg:w-1/2 bg-white p-6 lg:p-10 rounded-[2.5rem] shadow-xl border border-slate-100">
                            <input placeholder="Tên bài kiểm tra..." className="w-full text-xl font-black mb-6 outline-none border-b-4 border-slate-50 focus:border-blue-500 pb-2" value={quizTitle} onChange={e => setQuizTitle(e.target.value)} />
                            <div className="flex gap-4 mb-6">
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
                            <textarea placeholder="Câu 1: ...&#10;*A. Đúng&#10;B. Sai" className="w-full h-[350px] lg:h-[450px] bg-slate-50 p-6 rounded-[2rem] text-base font-medium outline-none focus:bg-white border-2 border-transparent focus:border-blue-100 transition-all resize-none shadow-inner" value={rawText} onChange={e => setRawText(e.target.value)} />
                            <button onClick={handlePublish} className="w-full mt-6 bg-slate-900 text-white py-5 rounded-[1.5rem] font-black uppercase tracking-widest shadow-2xl active:scale-95 transition-all">🚀 PHÁT ĐỀ NGAY</button>
                        </div>
                        <div className="w-full lg:w-1/2 bg-slate-100/50 rounded-[2.5rem] p-4 lg:p-10 border-4 border-dashed border-white">
                            <h3 className="font-black text-slate-400 uppercase text-[10px] tracking-widest mb-6 px-2 text-left">Preview đề thi</h3>
                            <div className="space-y-4">
                                {parseQuestions(rawText).map((q, i) => (
                                    <div key={i} className="bg-white p-5 rounded-[2rem] shadow-sm">
                                        <div className="font-black text-slate-800 mb-4 text-sm leading-tight text-left">{i+1}. {q.q}</div>
                                        <div className="grid grid-cols-1 gap-2">
                                            {q.a.map((opt, idx) => (
                                                <div key={idx} className={`p-3 rounded-xl text-[10px] font-bold border text-left ${idx === q.c ? 'bg-green-50 border-green-200 text-green-700' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
                        {history.map((h) => {
                            const count = results.filter(r => r.quizTitle === h.title).length;
                            return (
                                <div key={h.id} className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-50 flex flex-col h-full hover:shadow-2xl transition-all">
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter">Khối {h.grade}</span>
                                        <span className="text-[9px] font-bold text-slate-300">{h.createdAt?.toDate().toLocaleDateString('vi-VN')}</span>
                                    </div>
                                    <h4 className="font-black text-slate-800 text-xs mb-4 uppercase line-clamp-2 h-8 text-left leading-relaxed">{h.title}</h4>
                                    
                                    <div className="flex items-center gap-2 mb-6 bg-slate-50 p-3 rounded-2xl border border-slate-100 text-left">
                                        <span className="text-lg">👥</span>
                                        <div>
                                            <div className="text-[8px] font-black text-slate-400 uppercase leading-none">Học sinh đã làm</div>
                                            <div className="text-sm font-black text-blue-600 leading-none mt-1">{count} em</div>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 mt-auto">
                                        <button onClick={() => {
                                            setQuizTitle(h.title); setGrade(h.grade);
                                            const reconstructed = h.questions.map((q, idx) => {
                                                let qStr = `Câu ${idx+1}: ${q.q}\n`;
                                                q.a.forEach((opt, oIdx) => { qStr += `${oIdx === q.c ? '*' : ''}${String.fromCharCode(65+oIdx)}. ${opt}\n`; });
                                                return qStr;
                                            }).join('\n');
                                            setRawText(reconstructed); setView('create');
                                        }} className="flex-1 py-3 bg-slate-100 text-slate-500 rounded-xl font-black text-[9px] uppercase hover:bg-blue-600 hover:text-white transition-all shadow-sm">Sửa</button>

                                        {/* NÚT MỞ POPUP XUẤT ZIP */}
                                        <button onClick={() => setShowExportModal(h)} className="px-4 py-3 bg-purple-50 text-purple-600 rounded-xl hover:bg-purple-600 hover:text-white transition-all flex items-center justify-center shadow-sm" title="Xuất 4 đề Word & Đáp án Excel (.zip)">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                        </button>

                                        <button onClick={() => handleDelete(h.id, h.title)} className="px-4 py-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-600 hover:text-white transition-all flex items-center justify-center shadow-sm" title="Xóa vĩnh viễn">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>

                                        <button onClick={async () => {
                                            if(confirm(`Phát lại đề "${h.title}"?`)) {
                                                await db.collection("live_quizzes").doc(String(h.grade)).set({...h, createdAt: firebase.firestore.FieldValue.serverTimestamp()});
                                                alert("🚀 Đã phát lại thành công!");
                                            }
                                        }} className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-black text-[9px] uppercase shadow-lg active:scale-95 transition-all">Phát</button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* --- POPUP NHẬP THÔNG TIN TRƯỜNG LỚP TRƯỚC KHI XUẤT --- */}
            {showExportModal && (
                <div className="fixed inset-0 z-[1000] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-6 text-left">
                    <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 lg:p-10 shadow-2xl animate-in zoom-in duration-300">
                        <div className="text-4xl mb-4">🏫</div>
                        <h3 className="text-2xl font-black text-slate-800 uppercase italic mb-2">Thông tin in đề thi</h3>
                        <p className="text-slate-400 text-[10px] font-black uppercase mb-8 tracking-widest text-left">Thông tin này sẽ hiện ở tiêu đề file Word</p>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                            <div className="text-left">
                                <label className="text-[9px] font-black text-blue-500 uppercase ml-4 mb-1 block">Tên trường</label>
                                <input type="text" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-500 font-bold text-slate-700" 
                                    value={exportInfo.school} onChange={e => setExportInfo({...exportInfo, school: e.target.value})} />
                            </div>
                            <div className="text-left">
                                <label className="text-[9px] font-black text-blue-500 uppercase ml-4 mb-1 block">Tổ / Bộ môn</label>
                                <input type="text" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-500 font-bold text-slate-700" 
                                    value={exportInfo.department} onChange={e => setExportInfo({...exportInfo, department: e.target.value})} />
                            </div>
                            <div className="text-left">
                                <label className="text-[9px] font-black text-blue-500 uppercase ml-4 mb-1 block">Kỳ thi</label>
                                <input type="text" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-500 font-bold text-slate-700" 
                                    value={exportInfo.examName} onChange={e => setExportInfo({...exportInfo, examName: e.target.value})} />
                            </div>
                            <div className="text-left">
                                <label className="text-[9px] font-black text-blue-500 uppercase ml-4 mb-1 block">Năm học</label>
                                <input type="text" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-500 font-bold text-slate-700" 
                                    value={exportInfo.year} onChange={e => setExportInfo({...exportInfo, year: e.target.value})} />
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button onClick={() => setShowExportModal(null)} className="flex-1 py-4 font-black text-slate-400 uppercase text-[10px] tracking-widest">Hủy</button>
                            <button 
                                onClick={() => {
                                    handleExportZip(showExportModal);
                                    setShowExportModal(null);
                                }}
                                className="flex-[2] py-4 bg-purple-600 text-white rounded-2xl font-black uppercase text-[10px] shadow-xl shadow-purple-100 active:scale-95 transition-all"
                            >
                                🚀 Xuất Bộ Đề (.zip)
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
