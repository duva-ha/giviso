const GradeReport = ({ results = [] }) => {
    const [selectedQuiz, setSelectedQuiz] = React.useState("all");

    const quizNames = [...new Set(results?.map(r => r.quizTitle) || [])];

    const filteredResults = selectedQuiz === "all" 
        ? (results || []) 
        : (results?.filter(r => r.quizTitle === selectedQuiz) || []);

    const handleExport = () => {
        if (!filteredResults || filteredResults.length === 0) return alert("Không có dữ liệu!");

        const excelRows = filteredResults.map((item, index) => {
            // Đảm bảo lấy được điểm kể cả khi là số 0
            const finalPoint = (item.point !== undefined && item.point !== null) ? item.point : 0;
            // Đảm bảo lấy được tên (thử cả userName và name)
            const finalName = item.userName || item.name || "Học sinh ẩn danh";

            return {
                "STT": index + 1,
                "Họ và Tên": finalName,
                "Lớp": item.grade || "---",
                "Bài kiểm tra": item.quizTitle,
                "Điểm số": finalPoint,
                "Kết quả": item.detail || "---",
                "Ngày nộp": item.timestamp ? new Date(item.timestamp).toLocaleString('vi-VN') : "---"
            };
        });

        const worksheet = XLSX.utils.json_to_sheet(excelRows);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "DiemSo");
        XLSX.writeFile(workbook, `BangDiem_${selectedQuiz.replace(/\s+/g, '_')}.xlsx`);
    };

    if (!results || results.length === 0) {
        return (
            <div className="p-20 text-center bg-white rounded-[3rem] shadow-xl">
                <div className="text-5xl mb-4 animate-bounce">⏳</div>
                <h2 className="text-xl font-black text-slate-800 uppercase italic">Đang chờ dữ liệu nộp bài...</h2>
            </div>
        );
    }

    return (
        <div className="p-6 bg-white rounded-[3rem] shadow-xl border border-slate-100">
            <div className="flex justify-between items-center mb-8 gap-4">
                <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-black text-slate-800 uppercase italic italic">Báo cáo điểm số</h2>
                    <select 
                        value={selectedQuiz} 
                        onChange={(e) => setSelectedQuiz(e.target.value)}
                        className="px-4 py-2 border-2 border-slate-100 rounded-xl font-bold text-blue-600 bg-slate-50 outline-none"
                    >
                        <option value="all">-- Tất cả bài tập --</option>
                        {quizNames.map(name => <option key={name} value={name}>{name}</option>)}
                    </select>
                </div>
                <button onClick={handleExport} className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-2xl font-black shadow-lg">
                    📊 XUẤT EXCEL
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-800 text-white font-black uppercase text-[10px] tracking-widest">
                            <th className="p-5 rounded-tl-3xl">Người làm bài</th>
                            <th className="p-5">Bài thi</th>
                            <th className="p-5">Điểm số</th>
                            <th className="p-5 rounded-tr-3xl text-right">Ngày giờ xong</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredResults.map((res, i) => {
                            // LOGIC KIỂM TRA TÊN VÀ ĐIỂM
                            const displayName = res.userName || res.name || "Chưa có tên";
                            const displayPoint = (res.point !== undefined && res.point !== null) ? res.point : 0;

                            return (
                                <tr key={i} className="hover:bg-blue-50/50 transition-colors">
                                    <td className="p-5">
                                        <div className="font-bold text-slate-800">{displayName}</div>
                                        <div className="text-[10px] text-slate-400">{res.userEmail}</div>
                                    </td>
                                    <td className="p-5 text-sm font-bold text-blue-600">{res.quizTitle}</td>
                                    <td className="p-5 font-black text-2xl text-red-600">
                                        {displayPoint}
                                    </td>
                                    <td className="p-5 text-xs font-bold text-slate-400 text-right italic">
                                        {res.timestamp ? new Date(res.timestamp).toLocaleString('vi-VN') : '---'}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
