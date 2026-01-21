const GradeReport = ({ results = [] }) => {
    const [selectedQuiz, setSelectedQuiz] = React.useState("all");
    const [showPreview, setShowPreview] = React.useState(false);

    // 1. Lấy danh sách tên các bài thi để bỏ vào ô lọc
    const quizNames = [...new Set(results?.map(r => r.quizTitle || r.title).filter(Boolean) || [])];

    // 2. Lọc danh sách theo bài thi thầy chọn
    const filteredResults = selectedQuiz === "all" 
        ? (results || []) 
        : (results?.filter(r => (r.quizTitle || r.title) === selectedQuiz) || []);

    // 3. Chuẩn bị dữ liệu để xuất Excel
    const getExcelData = () => {
        return filteredResults.map((item, index) => ({
            "STT": index + 1,
            "Họ và Tên": item.userName || "Học sinh",
            "Lớp": item.grade || "---",
            "Bài kiểm tra": item.quizTitle || "Chưa rõ tên",
            "Điểm số": item.point || 0,
            "Tỷ lệ": item.detail || "---",
            "Thời gian": item.timestamp ? new Date(item.timestamp.seconds * 1000).toLocaleString('vi-VN') : "---"
        }));
    };

    return (
        <div className="p-4 lg:p-6 bg-white rounded-[2rem] lg:rounded-[3rem] shadow-xl m-2 lg:m-4 animate-in fade-in duration-500 text-left">
            
            {/* THANH ĐIỀU KHIỂN */}
            <div className="flex flex-col lg:flex-row justify-between items-center mb-8 gap-4 border-b pb-6">
                <div className="flex items-center gap-4 w-full lg:w-auto">
                    <div className="bg-blue-600 p-3 rounded-2xl shadow-lg">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    </div>
                    <div>
                        <h2 className="text-xl lg:text-2xl font-black text-slate-800 uppercase italic">Báo cáo điểm số</h2>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Cập nhật Realtime</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                    <select 
                        value={selectedQuiz} 
                        onChange={(e) => setSelectedQuiz(e.target.value)}
                        className="w-full sm:w-auto px-4 py-3 border-2 border-slate-100 rounded-2xl font-black text-[11px] text-blue-600 bg-slate-50 outline-none uppercase"
                    >
                        <option value="all">-- Tất cả bài tập --</option>
                        {quizNames.map(name => <option key={name} value={name}>{name}</option>)}
                    </select>
                </div>
            </div>

            {/* BẢNG ĐIỂM CÓ CỘT LỚP */}
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                        <tr className="bg-slate-50">
                            <th className="p-5 text-[10px] font-black uppercase text-slate-400 border-b">Học sinh</th>
                            <th className="p-5 text-[10px] font-black uppercase text-slate-400 border-b text-center">Lớp</th>
                            <th className="p-5 text-[10px] font-black uppercase text-slate-400 border-b">Tên bài thi</th>
                            <th className="p-5 text-[10px] font-black uppercase text-slate-400 border-b text-center">Điểm số</th>
                            <th className="p-5 text-[10px] font-black uppercase text-slate-400 border-b text-right">Ngày nộp</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {filteredResults.map((res, i) => (
                            <tr key={i} className="hover:bg-blue-50/30 transition-colors">
                                <td className="p-5">
                                    <div className="font-black text-slate-800 text-sm">{res.userName || "Học sinh"}</div>
                                    <div className="text-[9px] text-slate-400 font-bold lowercase">{res.userEmail || "---"}</div>
                                </td>
                                {/* CỘT LỚP MỚI BỔ SUNG */}
                                <td className="p-5 text-center">
                                    <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase">
                                        {res.grade || "---"}
                                    </span>
                                </td>
                                <td className="p-5">
                                    <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase border border-blue-100">
                                        {res.quizTitle || res.title || "Bài kiểm tra"}
                                    </span>
                                </td>
                                <td className="p-5 font-black text-3xl text-red-600 text-center tracking-tighter">
                                    {res.point !== undefined ? res.point : 0}
                                </td>
                                <td className="p-5 text-[10px] font-black text-slate-400 text-right uppercase italic">
                                    {res.timestamp ? new Date(res.timestamp.seconds * 1000).toLocaleString('vi-VN') : '---'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
