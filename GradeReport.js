const exportQuizExcel = (allResults, selectedQuizTitle) => {
    // 1. Lọc dữ liệu theo tên bài kiểm tra đã chọn
    const filteredData = allResults.filter(item => item.quizTitle === selectedQuizTitle);
    
    if (filteredData.length === 0) return alert("Không có dữ liệu cho bài này!");

    // 2. Định dạng cột cho Excel
    const excelRows = filteredData.map((item, index) => ({
        "STT": index + 1,
        "Học sinh": item.userName,
        "Lớp": item.grade,
        "Bài thi": item.quizTitle,
        "Điểm": item.point,
        "Tỉ lệ": item.detail,
        "Thời gian": new Date(item.timestamp).toLocaleString('vi-VN')
    }));

    // 3. Tiến hành xuất file
    const worksheet = XLSX.utils.json_to_sheet(excelRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "KetQua");
    XLSX.writeFile(workbook, `Diem_${selectedQuizTitle.replace(/\s+/g, '_')}.xlsx`);
};
