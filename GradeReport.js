function GradeReport({ db }) {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);

    // --- LẤY DỮ LIỆU ĐIỂM THỜI GIAN THỰC ---
    useEffect(() => {
        // Lắng nghe sự thay đổi từ ngăn tủ "quiz_results"
        const unsubscribe = db.collection("quiz_results")
            .orderBy("timestamp", "desc")
            .onSnapshot((snapshot) => {
                const data = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setResults(data);
                setLoading(false);
            }, (error) => {
                console.error("Lỗi lấy dữ liệu:", error);
                setLoading(false);
            });

        return () => unsubscribe();
    }, [db]);

    // --- LOGIC NHÓM ĐIỂM THEO BÀI KIỂM TRA ---
    const groupedResults = results.reduce((acc, current) => {
        const title = current.quizTitle || "Bài tập tự do";
        if (!acc[title]) acc[title] = [];
        acc[title].push(current);
        return acc;
    }, {});

    // --- HÀM XÓA DÒNG ĐIỂM (NẾU CẦN) ---
    const handleDeleteResult = async (id) => {
        if (confirm("Thầy có chắc chắn muốn xóa dòng điểm này không?")) {
            try {
                await db.collection("quiz_results").doc(id).delete();
            } catch (e) {
                alert("Lỗi khi xóa: " + e.message);
            }
        }
    };

    if (loading) return (
        <div className="h-full flex items-center justify-center">
            <div className="text-center">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="font-black text-slate-400 uppercase text-xs tracking-widest">Đang kết nối Student Hub...</p>
            </div>
        </div>
    );

    return (
        <div className="p-8 h-full overflow-y-auto custom-scroll bg-white">
            <header className="mb-12 flex justify-between items-end">
                <div>
                    <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Báo cáo kết quả</h2>
                    <p className="text-slate-400 font-bold mt-2 uppercase text-[10px] tracking-[0.3em]">Hệ thống cập nhật điểm tự động</p>
                </div>
                <div className="bg-blue-50 px-6 py-3 rounded-2xl border border-blue-100">
                    <span className="text-[10px] font-black text-blue-600 uppercase">Tổng cộng: {results.length} lượt nộp</span>
                </div>
            </header>

            {Object.keys(groupedResults).length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center border-4 border-dashed border-slate-100 rounded-[3rem]">
                    <span className="text-5xl mb-4">📊</span>
                    <p className="font-bold text-slate-300 uppercase text-sm">Chưa có dữ liệu bài làm nào</p>
                </div>
            ) : (
                Object.keys(groupedResults).map(quizTitle => (
                    <div key={quizTitle} className="mb-12 bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
                        {/* Header của từng nhóm bài */}
                        <div className="bg-slate-900 p-6 flex justify-between items-center">
                            <h3 className="text-white font-black text-xs uppercase tracking-widest flex items-center gap-3">
                                <span className="w-2 h-2 bg-blue-500 rounded-full animate-ping"></span>
                                {quizTitle}
                            </h3>
                            <span className="bg-white/10 text-white text-[10px] px-4 py-1.5 rounded-full font-black">
                                {groupedResults[quizTitle].length} HỌC SINH
                            </span>
                        </div>

                        {/* Bảng điểm chi tiết */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50 border-b border-slate-100">
                                        <th className="p-6 font-black text-slate-400 uppercase text-[10px] tracking-widest">Học sinh</th>
                                        <th className="p-6 font-black text-slate-400 uppercase text-[10px] tracking-widest text-center">Khối</th>
                                        <th className="p-6 font-black text-slate-400 uppercase text-[10px] tracking-widest text-center">Chi tiết</th>
                                        <th className="p-6 font-black text-slate-400 uppercase text-[10px] tracking-widest text-center">Điểm số</th>
                                        <th className="p-6 font-black text-slate-400 uppercase text-[10px] tracking-widest text-right">Thời gian</th>
                                        <th className="p-6"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {groupedResults[quizTitle].map((res) => (
                                        <tr key={res.id} className="hover:bg-blue-50/30 transition-all group">
                                            <td className="p-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-black text-slate-400 text-xs shadow-inner uppercase">
                                                        {res.studentName?.substring(0, 1)}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-800 text-sm">{res.studentName}</p>
                                                        <p className="text-[10px] text-slate-400 font-medium">{res.studentEmail}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-6 text-center">
                                                <span className="px-3 py-1 bg-slate-100 rounded-lg font-black text-slate-500 text-[10px]">K{res.grade}</span>
                                            </td>
                                            <td className="p-6 text-center font-bold text-slate-500 text-xs">
                                                {res.details}
                                            </td>
                                            <td className="p-6 text-center">
                                                <span className={`text-xl font-black ${res.score >= 5 ? 'text-blue-600' : 'text-rose-500'}`}>
                                                    {res.score}
                                                </span>
                                            </td>
                                            <td className="p-6 text-right">
                                                <p className="text-[11px] font-black text-slate-600 uppercase">
                                                    {res.timestamp?.toDate().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                                <p className="text-[9px] font-bold text-slate-300 uppercase">
                                                    {res.timestamp?.toDate().toLocaleDateString('vi-VN')}
                                                </p>
                                            </td>
                                            <td className="p-6 text-right">
                                                <button 
                                                    onClick={() => handleDeleteResult(res.id)}
                                                    className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-rose-500 transition-all"
                                                >
                                                    ✕
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}
