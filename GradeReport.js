const GradeReport = ({ results = [] }) => {
    // 1. Khai báo trạng thái để lọc bài thi
    const [selectedQuiz, setSelectedQuiz] = React.useState("all");

    // 2. Tự động gom danh sách tên bài thi (Thêm dấu ? để tránh lỗi map)
    const quizNames = [...new Set(results?.map(r => r.quizTitle) || [])];

    // 3. Lọc danh sách hiển thị
    const filteredResults = selectedQuiz === "all" 
        ? results 
        : results?.filter(r => r.quizTitle === selectedQuiz) || [];

    // 4. Hàm xử lý xuất Excel
    const handleExport = () => {
        if (!filteredResults || filteredResults.length === 0) return alert("Không có dữ liệu để xuất!");

        const excelRows = filteredResults.map((item, index) => ({
            "STT": index + 1,
            "Học sinh": item.userName,
            "Lớp": item.grade,
            "Bài kiểm tra": item.quizTitle,
            "Điểm số": item.point,
            "Tỉ lệ đúng": item.detail,
            "Ngày nộp bài": new Date(item.timestamp).toLocaleString('vi-VN')
        }));

        const worksheet = XLSX.utils.json_to_sheet(excelRows);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "DiemSo");

        const fileName = `Diem_${selectedQuiz === 'all' ? 'TongHop' : selectedQuiz.replace(/\s+/g, '_')}.xlsx`;
        XLSX.writeFile(workbook, fileName);
    };

    // NẾU CHƯA CÓ DỮ LIỆU THÌ HIỆN THÔNG BÁO CHỜ (Thay vì trắng trang)
    if (!results || results.length === 0) {
        return (
            <div className="p-20 text-center">
                <div className="text-4xl mb-4 animate-spin inline-block">⏳</div>
                <p className="text-slate-500 font-bold uppercase tracking-widest">Đang tải dữ liệu điểm từ Cloud...</p>
            </div>
        );
    }

    return (
        <div className="p-6 bg-white rounded-[2rem] shadow-xl border border-slate-100 animate-in fade-in duration-500">
            {/* THANH ĐIỀU KHIỂN */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-black text-slate-800 uppercase italic">Báo cáo điểm số</h2>
                    <select 
                        value={selectedQuiz} 
                        onChange={(e) => setSelectedQuiz(e.target.value)}
                        className="px-4 py-2 border-2 border-slate-100 rounded-xl font-bold text-blue-600 bg-slate-50 outline-none"
                    >
                        <option value="all">-- Tất cả bài tập --</option>
                        {quizNames.map(name => (
                            <option key={name} value={name}>{name}</option>
                        ))}
                    </select>
                </div>

                <button 
                    onClick={handleExport}
                    className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-2xl font-black shadow-lg shadow-green-100 flex items-center gap-2 transition-all"
                >
                    📥 XUẤT EXCEL {selectedQuiz !== 'all' ? 'BÀI NÀY' : 'TẤT CẢ'}
                </button>
            </div>

            {/* BẢNG ĐIỂM */}
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-800 text-white">
                            <th className="p-4 text-xs font-black uppercase rounded-tl-2xl">Học sinh</th>
                            <th className="p-4 text-xs font-black uppercase">Bài thi</th>
                            <th className="p-4 text-xs font-black uppercase">Điểm</th>
                            <th className="p-4 text-xs font-black uppercase rounded-tr-2xl text-right">Ngày nộp</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredResults.map((res, i) => (
                            <tr key={i} className="hover:bg-blue-50/50 transition-colors">
                                <td className="p-4">
                                    <div className="font-bold text-slate-700">{res.userName}</div>
                                    <div className="text-[10px] text-slate-400 font-medium">{res.userEmail}</div>
                                </td>
                                <td className="p-4 text-sm font-bold text-blue-600">{res.quizTitle}</td>
                                <td className="p-4 font-black text-slate-800">{res.point}</td>
                                <td className="p-4 text-xs font-bold text-slate-400 text-right">
                                    {res.timestamp ? new Date(res.timestamp).toLocaleString('vi-VN') : '---'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
