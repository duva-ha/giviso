const GradeReport = ({ results = [] }) => {
    // 1. Trạng thái lọc bài thi
    const [selectedQuiz, setSelectedQuiz] = React.useState("all");

    // 2. Lấy danh sách tên các bài thi duy nhất để đưa vào menu chọn
    const quizNames = [...new Set(results?.map(r => r.quizTitle).filter(Boolean) || [])];

    // 3. Lọc danh sách kết quả theo bài thi thầy chọn
    const filteredResults = selectedQuiz === "all" 
        ? (results || []) 
        : (results?.filter(r => r.quizTitle === selectedQuiz) || []);

    // 4. Hàm Xuất Excel hoàn chỉnh
    const handleExport = () => {
        if (!filteredResults || filteredResults.length === 0) {
            return alert("Không có dữ liệu để xuất!");
        }

        const excelRows = filteredResults.map((item, index) => {
            // Đảm bảo lấy được tên kể cả khi trường dữ liệu là userName hoặc name
            const finalName = item.userName || item.name || "Học sinh";
            
            // Đảm bảo số 0 vẫn hiện ra (không bị coi là trống)
            const finalPoint = (item.point !== undefined && item.point !== null) ? item.point : 0;
            
            // Xử lý ngày giờ chuẩn xác
            let dateStr = "---";
            if (item.timestamp) {
                const d = item.timestamp.seconds ? new Date(item.timestamp.seconds * 1000) : new Date(item.timestamp);
                dateStr = d.toLocaleString('vi-VN');
            }

            return {
                "STT": index + 1,
                "HỌ VÀ TÊN": finalName,
                "LỚP": item.grade || "---",
                "BÀI KIỂM TRA": item.quizTitle || "Chưa rõ",
                "ĐIỂM SỐ": finalPoint,
                "TỈ LỆ ĐÚNG": item.detail || "---",
                "NGÀY GIỜ HOÀN THÀNH": dateStr
            };
        });

        const worksheet = XLSX.utils.json_to_sheet(excelRows);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "DiemSo");

        // Tên file lưu theo tên bài kiểm tra
        const fileName = `BangDiem_${selectedQuiz === 'all' ? 'TongHop' : selectedQuiz.replace(/\s+/g, '_')}.xlsx`;
        XLSX.writeFile(workbook, fileName);
    };

    // MÀN HÌNH CHỜ KHI CHƯA CÓ DỮ LIỆU
    if (!results || results.length === 0) {
        return (
            <div className="p-20 text-center flex flex-col items-center justify-center bg-white rounded-[3rem] shadow-xl m-4">
                <div className="text-6xl mb-6 animate-bounce">⏳</div>
                <h2 className="text-xl font-black text-slate-800 uppercase tracking-widest italic">Đang tải dữ liệu điểm...</h2>
                <p className="text-slate-400 mt-2 font-bold text-sm italic">Vui lòng kiểm tra kết nối Firebase hoặc chờ học sinh nộp bài</p>
            </div>
        );
    }

    return (
        <div className="p-6 bg-white rounded-[3rem] shadow-xl border border-slate-100 m-4 animate-in fade-in duration-500">
            {/* THANH ĐIỀU KHIỂN */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 border-b border-slate-50 pb-6">
                <div className="flex items-center gap-4">
                    <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-200">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 uppercase italic leading-none">Báo cáo điểm số</h2>
                        <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-tighter">Quản lý kết quả thi trực tuyến</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* MENU LỌC */}
                    <select 
                        value={selectedQuiz} 
                        onChange={(e) => setSelectedQuiz(e.target.value)}
                        className="px-4 py-3 border-2 border-slate-100 rounded-2xl font-bold text-blue-600 bg-slate-50 outline-none hover:border-blue-300 transition-all cursor-pointer shadow-sm min-w-[200px]"
                    >
                        <option value="all">-- Tất cả bài tập --</option>
                        {quizNames.map(name => (
                            <option key={name} value={name}>{name}</option>
                        ))}
                    </select>

                    {/* NÚT XUẤT EXCEL */}
                    <button 
                        onClick={handleExport}
                        className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-2xl font-black shadow-lg shadow-green-100 flex items-center gap-2 transition-all active:scale-95"
                    >
                        📥 XUẤT EXCEL
                    </button>
                </div>
            </div>

            {/* BẢNG HIỂN THỊ */}
            <div className="overflow-x-auto custom-scroll">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-800 text-white">
                            <th className="p-5 text-[10px] font-black uppercase rounded-tl-3xl tracking-widest">Học sinh</th>
                            <th className="p-5 text-[10px] font-black uppercase tracking-widest">Bài thi</th>
                            <th className="p-5 text-[10px] font-black uppercase tracking-widest">Điểm số</th>
                            <th className="p-5 text-[10px] font-black uppercase rounded-tr-3xl text-right tracking-widest">Ngày giờ nộp</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredResults.map((res, i) => {
                            const displayName = res.userName || res.name || "Chưa rõ tên";
                            const displayPoint = (res.point !== undefined && res.point !== null) ? res.point : 0;
                            
                            return (
                                <tr key={i} className="hover:bg-blue-50/50 transition-colors group">
                                    <td className="p-5">
                                        <div className="font-black text-slate-800 group-hover:text-blue-600 transition-colors">{displayName}</div>
                                        <div className="text-[10px] text-slate-400 font-bold uppercase">{res.userEmail || 'No Email'}</div>
                                    </td>
                                    <td className="p-5">
                                        <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase shadow-sm">
                                            {res.quizTitle || 'Bài tập'}
                                        </span>
                                    </td>
                                    <td className="p-5 font-black text-3xl text-red-600 drop-shadow-sm">
                                        {displayPoint}
                                    </td>
                                    <td className="p-5 text-[11px] font-bold text-slate-400 text-right italic">
                                        {res.timestamp ? (res.timestamp.seconds ? new Date(res.timestamp.seconds * 1000).toLocaleString('vi-VN') : new Date(res.timestamp).toLocaleString('vi-VN')) : '---'}
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
