const GradeReport = ({ results = [] }) => {
    // 1. Khai báo trạng thái để lọc bài thi
    const [selectedQuiz, setSelectedQuiz] = React.useState("all");

    // 2. Tự động gom danh sách tên bài thi (Dùng dấu ? để bảo vệ mảng)
    const quizNames = [...new Set(results?.map(r => r.quizTitle) || [])];

    // 3. Lọc danh sách hiển thị
    const filteredResults = selectedQuiz === "all" 
        ? (results || []) 
        : (results?.filter(r => r.quizTitle === selectedQuiz) || []);

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
            "Ngày nộp bài": item.timestamp ? new Date(item.timestamp).toLocaleString('vi-VN') : "---"
        }));

        const worksheet = XLSX.utils.json_to_sheet(excelRows);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "DiemSo");

        const fileName = `Diem_${selectedQuiz === 'all' ? 'TongHop' : selectedQuiz.replace(/\s+/g, '_')}.xlsx`;
        XLSX.writeFile(workbook, fileName);
    };

    // CHỐT CHẶN: Nếu kết quả rỗng thì hiện màn hình chờ thay vì làm trắng trang
    if (!results || results.length === 0) {
        return (
            <div className="p-20 text-center flex flex-col items-center justify-center bg-white rounded-[3rem] shadow-xl">
                <div className="text-5xl mb-6 animate-bounce">⏳</div>
                <h2 className="text-xl font-black text-slate-800 uppercase tracking-widest">Đang tải dữ liệu điểm...</h2>
                <p className="text-slate-400 mt-2 font-bold italic text-sm">Vui lòng chờ trong giây lát</p>
            </div>
        );
    }

    return (
        <div className="p-6 bg-white rounded-[3rem] shadow-xl border border-slate-100 animate-in fade-in duration-500">
            {/* THANH ĐIỀU KHIỂN */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-black text-slate-800 uppercase italic">Báo cáo điểm số</h2>
                    <select 
                        value={selectedQuiz} 
                        onChange={(e) => setSelectedQuiz(e.target.value)}
                        className="px-4 py-2 border-2 border-slate-100 rounded-xl font-bold text-blue-600 bg-slate-50 outline-none hover:border-blue-200 transition-all cursor-pointer shadow-sm"
                    >
                        <option value="all">-- Tất cả bài tập --</option>
                        {quizNames.map(name => (
                            <option key={name} value={name}>{name}</option>
                        ))}
                    </select>
                </div>

                <button 
                    onClick={handleExport}
                    className="bg-green-600 hover:bg-green-700 text-white px-10 py-3 rounded-2xl font-black shadow-lg shadow-green-100 flex items-center gap-2 transition-all active:scale-95"
                >
                    📥 XUẤT EXCEL {selectedQuiz !== 'all' ? 'BÀI NÀY' : 'TẤT CẢ'}
                </button>
            </div>

            {/* BẢNG ĐIỂM */}
            <div className="overflow-x-auto custom-scroll">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-800 text-white">
                            <th className="p-5 text-[10px] font-black uppercase rounded-tl-3xl tracking-widest">Học sinh</th>
                            <th className="p-5 text-[10px] font-black uppercase tracking-widest">Bài thi</th>
                            <th className="p-5 text-[10px] font-black uppercase tracking-widest">Điểm</th>
                            <th className="p-5 text-[10px] font-black uppercase rounded-tr-3xl text-right tracking-widest">Ngày nộp</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredResults.map((res, i) => (
                            <tr key={i} className="hover:bg-blue-50/50 transition-colors group">
                                <td className="p-5">
                                    <div className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{res.userName}</div>
                                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{res.userEmail}</div>
                                </td>
                                <td className="p-5">
                                    <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase">
                                        {res.quizTitle}
                                    </span>
                                </td>
                                <td className="p-5 font-black text-xl text-slate-800">{res.point}</td>
                                <td className="p-5 text-[11px] font-bold text-slate-400 text-right">
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
