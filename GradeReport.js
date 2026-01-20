const GradeReport = ({ results = [] }) => {
    const [selectedQuiz, setSelectedQuiz] = React.useState("all");
    const [showPreview, setShowPreview] = React.useState(false);

    // 1. Lấy danh sách tên bài thi duy nhất
    const quizNames = [...new Set(results?.map(r => r.quizTitle).filter(Boolean) || [])];

    // 2. Lọc dữ liệu theo bài thi đang chọn
    const filteredResults = selectedQuiz === "all" 
        ? (results || []) 
        : (results?.filter(r => r.quizTitle === selectedQuiz) || []);

    // 3. Hàm chuẩn hóa dữ liệu cho Excel (Dùng chung cho Preview và Export)
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

    // 4. Hàm Xuất Excel
    const handleExport = () => {
        const data = getExcelData();
        if (data.length === 0) return alert("Không có dữ liệu!");
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "DiemSo");
        XLSX.writeFile(workbook, `BangDiem_${selectedQuiz.replace(/\s+/g, '_')}.xlsx`);
        setShowPreview(false);
    };

    if (!results || results.length === 0) {
        return (
            <div className="p-20 text-center flex flex-col items-center justify-center bg-white rounded-[3rem] shadow-xl m-4">
                <div className="text-5xl mb-4 animate-bounce">⏳</div>
                <h2 className="text-xl font-black text-slate-800 uppercase italic">Đang tải dữ liệu điểm...</h2>
            </div>
        );
    }

    return (
        <div className="p-6 bg-white rounded-[3rem] shadow-xl border border-slate-100 m-4 animate-in fade-in duration-500">
            {/* THANH ĐIỀU KHIỂN CHÍNH */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 border-b border-slate-50 pb-6">
                <div className="flex items-center gap-4">
                    <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-200">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 uppercase italic leading-none">Báo cáo điểm số</h2>
                        <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase">Hệ thống quản lý GIVISO PRO</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <select 
                        value={selectedQuiz} 
                        onChange={(e) => setSelectedQuiz(e.target.value)}
                        className="px-4 py-3 border-2 border-slate-100 rounded-2xl font-bold text-blue-600 bg-slate-50 outline-none hover:border-blue-300 transition-all cursor-pointer shadow-sm min-w-[200px]"
                    >
                        <option value="all">-- Tất cả bài tập --</option>
                        {quizNames.map(name => <option key={name} value={name}>{name}</option>)}
                    </select>

                    <button 
                        onClick={() => setShowPreview(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-2xl font-black shadow-lg shadow-blue-100 transition-all active:scale-95 flex items-center gap-2"
                    >
                        👁️ XEM TRƯỚC
                    </button>
                </div>
            </div>

            {/* BẢNG HIỂN THỊ TRÊN GIAO DIỆN CHÍNH */}
            <div className="overflow-x-auto custom-scroll">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr>
                            <th className="p-5 text-[11px] font-black uppercase tracking-widest text-slate-600 border-b-2 border-slate-100">Người làm bài</th>
                            <th className="p-5 text-[11px] font-black uppercase tracking-widest text-slate-600 border-b-2 border-slate-100">Bài thi</th>
                            <th className="p-5 text-[11px] font-black uppercase tracking-widest text-slate-600 border-b-2 border-slate-100 text-center">Điểm số</th>
                            <th className="p-5 text-[11px] font-black uppercase tracking-widest text-slate-600 border-b-2 border-slate-100 text-right">Ngày giờ xong</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredResults.map((res, i) => (
                            <tr key={i} className="hover:bg-blue-50/50 transition-colors group">
                                <td className="p-5">
                                    <div className="font-black text-slate-800 group-hover:text-blue-600 transition-colors">{res.userName || res.name || "Chưa rõ tên"}</div>
                                    <div className="text-[10px] text-slate-400 font-bold italic">{res.userEmail || "No Email"}</div>
                                </td>
                                <td className="p-5">
                                    <span className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase border border-blue-100">
                                        {res.quizTitle || "Kiểm tra"}
                                    </span>
                                </td>
                                <td className="p-5 font-black text-3xl text-red-600 text-center">
                                    {res.point !== undefined ? res.point : 0}
                                </td>
                                <td className="p-5 text-[11px] font-bold text-slate-400 text-right italic">
                                    {res.timestamp ? (res.timestamp.seconds ? new Date(res.timestamp.seconds * 1000).toLocaleString('vi-VN') : new Date(res.timestamp).toLocaleString('vi-VN')) : '---'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* KHUNG XEM TRƯỚC (MODAL PREVIEW) */}
            {showPreview && (
                <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-6xl max-h-[85vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
                        
                        {/* Header của Preview - Đã chỉnh chữ đen rõ nét */}
                        <div className="p-8 bg-white border-b flex justify-between items-center">
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 uppercase">Khung xem trước dữ liệu Excel</h3>
                                <p className="text-sm text-slate-500 font-bold uppercase tracking-tighter">Vui lòng kiểm tra kỹ tên và điểm trước khi tải xuống</p>
                            </div>
                            <button onClick={() => setShowPreview(false)} className="bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-500 p-3 rounded-full transition-all">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>

                        {/* Nội dung bảng Excel - Màu chữ đen đặc trên nền kẻ ô */}
                        <div className="flex-1 overflow-auto p-6 bg-slate-50">
                            <div className="bg-white shadow-inner rounded-xl border border-slate-200 overflow-hidden">
                                <table className="w-full border-collapse">
                                    <thead className="bg-slate-200 sticky top-0">
                                        <tr>
                                            {Object.keys(getExcelData()[0] || {}).map(key => (
                                                <th key={key} className="border border-slate-300 p-3 text-[11px] font-black text-slate-900 uppercase tracking-widest text-left">
                                                    {key}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {getExcelData().map((row, i) => (
                                            <tr key={i} className="hover:bg-yellow-50/50">
                                                {Object.values(row).map((val, idx) => (
                                                    <td key={idx} className="border border-slate-200 p-3 text-xs font-bold text-slate-900 whitespace-nowrap">
                                                        {val}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Footer của Preview */}
                        <div className="p-8 bg-white border-t flex justify-end gap-4">
                            <button onClick={() => setShowPreview(false)} className="px-8 py-4 font-black text-slate-400 hover:text-slate-600 uppercase text-xs tracking-widest">Hủy bỏ</button>
                            <button 
                                onClick={handleExport}
                                className="bg-green-600 hover:bg-green-700 text-white px-10 py-4 rounded-2xl font-black shadow-xl shadow-green-100 flex items-center gap-3 transition-all active:scale-95"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                                XUẤT FILE EXCEL NGAY
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
