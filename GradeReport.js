const GradeReport = ({ results = [] }) => {
    const [selectedQuiz, setSelectedQuiz] = React.useState("all");
    const [showPreview, setShowPreview] = React.useState(false); // Trạng thái hiện Preview

    const quizNames = [...new Set(results?.map(r => r.quizTitle).filter(Boolean) || [])];
    const filteredResults = selectedQuiz === "all" 
        ? (results || []) 
        : (results?.filter(r => r.quizTitle === selectedQuiz) || []);

    // 1. Hàm định dạng dữ liệu chuẩn (Dùng chung cho cả Xem trước và Xuất file)
    const getExcelData = () => {
        return filteredResults.map((item, index) => ({
            "STT": index + 1,
            "Họ và Tên": item.userName || item.name || "Học sinh",
            "Lớp": item.grade || "---",
            "Bài kiểm tra": item.quizTitle || "Chưa rõ",
            "Điểm số": (item.point !== undefined && item.point !== null) ? item.point : 0,
            "Kết quả": item.detail || "---",
            "Ngày nộp": item.timestamp ? (item.timestamp.seconds ? new Date(item.timestamp.seconds * 1000).toLocaleString('vi-VN') : new Date(item.timestamp).toLocaleString('vi-VN')) : "---"
        }));
    };

    // 2. Hàm Xuất file thực sự
    const handleExport = () => {
        const data = getExcelData();
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "DiemSo");
        XLSX.writeFile(workbook, `BangDiem_${selectedQuiz.replace(/\s+/g, '_')}.xlsx`);
        setShowPreview(false); // Tải xong thì đóng preview
    };

    if (!results || results.length === 0) return <div className="p-20 text-center animate-bounce">⏳ Đang tải dữ liệu...</div>;

    return (
        <div className="p-6 bg-white rounded-[3rem] shadow-xl border border-slate-100 m-4">
            {/* THANH ĐIỀU KHIỂN */}
            <div className="flex justify-between items-center mb-8 border-b pb-6">
                <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-black text-slate-800 uppercase italic">Báo cáo điểm số</h2>
                    <select 
                        value={selectedQuiz} 
                        onChange={(e) => setSelectedQuiz(e.target.value)}
                        className="px-4 py-2 border-2 border-slate-100 rounded-xl font-bold text-blue-600 outline-none"
                    >
                        <option value="all">-- Tất cả bài tập --</option>
                        {quizNames.map(name => <option key={name} value={name}>{name}</option>)}
                    </select>
                </div>
                
                {/* NÚT XEM TRƯỚC */}
                <button 
                    onClick={() => setShowPreview(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-2xl font-black shadow-lg shadow-blue-100 transition-all"
                >
                    👁️ XEM TRƯỚC EXCEL
                </button>
            </div>

            {/* BẢNG HIỂN THỊ CHÍNH (Vẫn giữ như cũ) */}
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-800 text-white font-black text-[10px] uppercase">
                        <tr><th className="p-5 rounded-tl-3xl">Học sinh</th><th className="p-5">Bài thi</th><th className="p-5">Điểm</th><th className="p-5 rounded-tr-3xl text-right">Ngày nộp</th></tr>
                    </thead>
                    <tbody>
                        {filteredResults.map((res, i) => (
                            <tr key={i} className="border-b">
                                <td className="p-5 font-bold">{res.userName || "Chưa rõ"}</td>
                                <td className="p-5 text-blue-600">{res.quizTitle}</td>
                                <td className="p-5 font-black text-2xl text-red-600">{res.point !== undefined ? res.point : 0}</td>
                                <td className="p-5 text-right italic text-slate-400 text-xs">{res.timestamp ? "Đã nộp" : "---"}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* KHUNG XEM TRƯỚC (MODAL PREVIEW) */}
            {showPreview && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-5xl max-h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
                        {/* Header của Preview */}
                        <div className="p-6 bg-slate-50 border-b flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-black text-slate-800 uppercase">Xem trước file Excel</h3>
                                <p className="text-xs text-slate-500 font-bold">Dữ liệu sẽ được xuất chính xác như bảng dưới đây</p>
                            </div>
                            <button onClick={() => setShowPreview(false)} className="text-slate-400 hover:text-red-500 text-2xl">✕</button>
                        </div>

                        {/* Nội dung bảng mô phỏng Excel */}
                        <div className="flex-1 overflow-auto p-4 bg-slate-100/50">
                            <table className="w-full bg-white border border-slate-300 border-collapse text-xs">
                                <thead className="bg-slate-200 sticky top-0">
                                    <tr>
                                        {Object.keys(getExcelData()[0] || {}).map(key => (
                                            <th key={key} className="border border-slate-300 p-2 text-slate-600 font-black">{key}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {getExcelData().map((row, i) => (
                                        <tr key={i}>
                                            {Object.values(row).map((val, idx) => (
                                                <td key={idx} className="border border-slate-200 p-2 text-slate-700">{val}</td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Footer của Preview */}
                        <div className="p-6 border-t flex justify-end gap-4">
                            <button onClick={() => setShowPreview(false)} className="px-6 py-3 font-bold text-slate-500 hover:text-slate-700">HỦY BỎ</button>
                            <button 
                                onClick={handleExport}
                                className="bg-green-600 hover:bg-green-700 text-white px-10 py-3 rounded-2xl font-black shadow-lg shadow-green-200 flex items-center gap-2"
                            >
                                ✅ XUẤT FILE NGAY (.XLSX)
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
