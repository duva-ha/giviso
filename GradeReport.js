const GradeReport = ({ results }) => {
    const [filterQuiz, setFilterQuiz] = React.useState("all");

    // Lấy danh sách các tên bài tập duy nhất để làm menu lọc
    const quizList = [...new Set(results.map(r => r.quizTitle))];

    // Lọc dữ liệu theo bài được chọn
    const filteredResults = filterQuiz === "all" 
        ? results 
        : results.filter(r => r.quizTitle === filterQuiz);

    const handleExport = () => {
        if (filteredResults.length === 0) return alert("Không có dữ liệu!");

        const data = filteredResults.map((item, index) => ({
            "STT": index + 1,
            "Học sinh": item.userName,
            "Lớp": item.grade,
            "Bài kiểm tra": item.quizTitle,
            "Điểm": item.point,
            "Tỉ lệ": item.detail,
            "Ngày nộp": new Date(item.timestamp).toLocaleString('vi-VN')
        }));

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "KetQua");
        XLSX.writeFile(workbook, `Diem_${filterQuiz === 'all' ? 'TongHop' : filterQuiz}.xlsx`);
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div className="flex gap-4 items-center">
                    <h2 className="text-xl font-bold">Báo cáo điểm số</h2>
                    <select 
                        className="p-2 border rounded-xl font-bold"
                        value={filterQuiz}
                        onChange={(e) => setFilterQuiz(e.target.value)}
                    >
                        <option value="all">Tất cả bài tập</option>
                        {quizList.map(name => <option key={name} value={name}>{name}</option>)}
                    </select>
                </div>
                <button 
                    onClick={handleExport}
                    className="bg-green-600 text-white px-6 py-2 rounded-xl font-bold shadow-lg shadow-green-200"
                >
                    📊 Xuất Excel {filterQuiz !== 'all' ? `bài ${filterQuiz}` : ''}
                </button>
            </div>

            {/* Phần hiển thị bảng điểm của thầy giữ nguyên ở đây */}
        </div>
    );
};
