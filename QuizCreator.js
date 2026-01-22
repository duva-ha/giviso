import React, { useState, useEffect, useRef } from 'react';
// Lưu ý: Đảm bảo thầy đã cài đặt hoặc nhúng: docx, jszip, file-saver, xlsx, mammoth

const { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel, Table, TableRow, TableCell, BorderStyle, WidthType } = window.docx || {};

const QuizCreator = ({ db, firebase, results = [] }) => {
    const [quizTitle, setQuizTitle] = useState("");
    const [grade, setGrade] = useState("10");
    const [time, setTime] = useState(15);
    const [rawText, setRawText] = useState("");
    const [history, setHistory] = useState([]);
    const [view, setView] = useState("create");
    const [isExporting, setIsExporting] = useState(false);
    const fileInputRef = useRef(null);

    const [showExportModal, setShowExportModal] = useState(null);
    const [exportInfo, setExportInfo] = useState({
        school: "TRƯỜNG THPT ....................",
        department: "TỔ CÔNG NGHỆ",
        year: "Năm học: 2025 - 2026",
        examName: "KIỂM TRA ĐỊNH KỲ",
    });

    // --- HELPER: XÁO TRỘN MẢNG ---
    const shuffleArray = (array) => {
        const newArr = [...array];
        for (let i = newArr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
        }
        return newArr;
    };

    // --- LOGIC XỬ LÝ TEXT THÀNH CÂU HỎI (CẢI TIẾN) ---
    const parseQuestions = (text) => {
        if (!text) return [];
        // Tách câu hỏi dựa trên "Câu" đứng ở đầu dòng để tránh lẫn lộn trong nội dung
        const parts = text.split(/^\s*Câu\s*\d+[:.]/im).filter(p => p.trim());
        return parts.map(p => {
            const lines = p.trim().split('\n').filter(l => l.trim());
            const qText = lines[0]?.trim();
            // Nhận diện đáp án bắt đầu bằng A,B,C,D hoặc có dấu *
            const options = lines.slice(1).filter(l => /^[A-D][:.]\s*/i.test(l.trim()) || l.startsWith('*'));
            
            const cleanOptions = options.map(o => o.replace(/^[A-D][:.]\s*/i, '').replace(/^\*/, '').trim());
            const correctIdx = options.findIndex(l => l.trim().startsWith('*'));

            return { q: qText, a: cleanOptions, c: correctIdx === -1 ? 0 : correctIdx };
        });
    };

    // --- XUẤT BỘ ĐỀ ZIP (4 MÃ ĐỀ + EXCEL) ---
    const handleExportZip = async (quiz) => {
        setIsExporting(true);
        const zip = new JSZip();
        const totalVersions = 4;
        const allAnswers = [];

        try {
            for (let i = 1; i <= totalVersions; i++) {
                const examCode = 100 + i;
                let shuffledQs = shuffleArray(quiz.questions);
                
                const readyData = shuffledQs.map((item, qIdx) => {
                    let optionsWithMeta = item.a.map((text, idx) => ({
                        text, isCorrect: idx === item.c
                    }));
                    optionsWithMeta = shuffleArray(optionsWithMeta);
                    
                    const correctLetter = String.fromCharCode(65 + optionsWithMeta.findIndex(o => o.isCorrect));
                    
                    // Lưu đáp án vào danh sách Excel
                    allAnswers.push({
                        "Mã đề": examCode,
                        "Câu số": qIdx + 1,
                        "Đáp án đúng": correctLetter
                    });

                    return {
                        q: item.q,
                        options: optionsWithMeta.map(o => o.text),
                    };
                });

                // Tạo file Word với Table Header chuyên nghiệp
                const doc = new window.docx.Document({
                    styles: { default: { document: { run: { size: 24, font: "Times New Roman" } } } },
                    sections: [{
                        children: [
                            new Paragraph({
                                children: [
                                    new TextRun({ text: exportInfo.school.toUpperCase(), bold: true }),
                                    new TextRun({ text: "\t\t" + exportInfo.examName.toUpperCase(), bold: true }),
                                ],
                                alignment: AlignmentType.LEFT,
                            }),
                            new Paragraph({
                                children: [
                                    new TextRun({ text: exportInfo.department.toUpperCase() }),
                                    new TextRun({ text: "\t\t\t" + exportInfo.year }),
                                ],
                                spacing: { after: 200 },
                            }),
                            new Paragraph({
                                text: `BÀI KIỂM TRA: ${quiz.title.toUpperCase()}`,
                                heading: HeadingLevel.HEADING_1,
                                alignment: AlignmentType.CENTER,
                            }),
                            new Paragraph({
                                text: `Mã đề: ${examCode}`,
                                alignment: AlignmentType.CENTER,
                                spacing: { after: 400 },
                            }),
                            new Paragraph({ text: "Họ và tên:...................................................... Lớp:..........", spacing: { after: 300 } }),
                            
                            ...readyData.flatMap((q, idx) => [
                                new Paragraph({
                                    children: [
                                        new TextRun({ text: `Câu ${idx + 1}: `, bold: true }),
                                        new TextRun(q.q),
                                    ],
                                    spacing: { before: 200 },
                                }),
                                new Paragraph({
                                    text: q.options.map((opt, oIdx) => `${String.fromCharCode(65 + oIdx)}. ${opt}`).join("       "),
                                    spacing: { after: 100 }
                                })
                            ])
                        ],
                    }],
                });

                const docBlob = await window.docx.Packer.toBlob(doc);
                zip.file(`De_Thi_Ma_${examCode}.docx`, docBlob);
            }

            // Xuất Excel đáp án
            const ws = XLSX.utils.json_to_sheet(allAnswers);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "DapAn");
            const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
            zip.file("Dap_An_Tong_Hop.xlsx", excelBuffer);

            const content = await zip.generateAsync({ type: "blob" });
            saveAs(content, `GIVISO_DE_THI_${quiz.title}.zip`);
        } catch (error) {
            console.error(error);
            alert("Có lỗi xảy ra khi xuất file!");
        }
        setIsExporting(false);
    };

    // --- FIREBASE EFFECTS ---
    useEffect(() => {
        const unsub = db.collection("quizzes_history")
            .orderBy("createdAt", "desc")
            .limit(50) // Giới hạn để tránh tải quá nhiều
            .onSnapshot(s => {
                setHistory(s.docs.map(d => ({ id: d.id, ...d.data() })));
            });
        return () => unsub();
    }, []);

    const handlePublish = async () => {
        const questions = parseQuestions(rawText);
        if (!quizTitle || questions.length === 0) return alert("Vui lòng nhập tên đề và nội dung câu hỏi!");
        
        const quizData = {
            title: quizTitle, grade, 
            time: parseInt(time) * 60,
            questions, isLive: true,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        try {
            await db.collection("live_quizzes").doc(grade).set(quizData);
            await db.collection("quizzes_history").add(quizData);
            alert("🚀 Đề thi đã được phát thành công!");
            setRawText(""); setQuizTitle("");
        } catch (e) { alert("Lỗi hệ thống: " + e.message); }
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 overflow-hidden text-left relative">
            {/* Thanh điều hướng */}
            <div className="flex flex-col sm:flex-row justify-between items-center p-4 bg-white border-b gap-4">
                <div className="flex bg-slate-100 p-1 rounded-2xl font-black">
                    <button onClick={() => setView("create")} className={`px-6 py-2.5 rounded-xl text-[10px] uppercase transition-all ${view === 'create' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>Soạn đề</button>
                    <button onClick={() => setView("history")} className={`px-6 py-2.5 rounded-xl text-[10px] uppercase transition-all ${view === 'history' ? 'bg-white text-orange-500 shadow-sm' : 'text-slate-400'}`}>Kho đề</button>
                </div>
                {view === "create" && (
                    <button onClick={() => fileInputRef.current.click()} className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase">📥 Nhập Word</button>
                )}
                <input type="file" ref={fileInputRef} onChange={(e) => {/* Giữ nguyên logic Mammoth cũ của thầy */}} accept=".docx" className="hidden" />
            </div>

            {/* Nội dung chính: Thầy giữ nguyên phần JSX hiển thị Preview và History như cũ */}
            {/* ... (Phần UI cũ của thầy) ... */}

            {/* Modal Xuất ZIP (Cải tiến giao diện chờ) */}
            {showExportModal && (
                <div className="fixed inset-0 z-[1000] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-6">
                    <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl">
                        <h3 className="text-2xl font-black mb-6 uppercase italic">Thông tin in đề</h3>
                        <div className="grid grid-cols-1 gap-4 mb-8">
                            <input placeholder="Tên trường" className="p-4 bg-slate-50 border rounded-2xl" value={exportInfo.school} onChange={e => setExportInfo({...exportInfo, school: e.target.value})} />
                            <input placeholder="Kỳ thi" className="p-4 bg-slate-50 border rounded-2xl" value={exportInfo.examName} onChange={e => setExportInfo({...exportInfo, examName: e.target.value})} />
                        </div>
                        <div className="flex gap-4">
                            <button onClick={() => setShowExportModal(null)} className="flex-1 font-bold text-slate-400">HỦY</button>
                            <button 
                                onClick={() => { handleExportZip(showExportModal); setShowExportModal(null); }}
                                className="flex-[2] py-4 bg-purple-600 text-white rounded-2xl font-black uppercase shadow-lg disabled:bg-slate-400"
                                disabled={isExporting}
                            >
                                {isExporting ? "ĐANG TẠO FILE..." : "🚀 XUẤT BỘ ĐỀ (.ZIP)"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QuizCreator;
