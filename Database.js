const Database = {
    // 1. Lấy danh sách điểm thi từ học sinh (Realtime)
    getQuizResults: (callback) => {
        return firebase.firestore().collection("quiz_results")
            .orderBy("timestamp", "desc")
            .onSnapshot((snapshot) => {
                const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
                callback(data);
            });
    },

    // 2. Lưu ghi chú/Giáo án
    saveNote: async (userData, category, content, fileData = null) => {
        try {
            await firebase.firestore().collection("notes").add({
                userId: userData.uid,
                category: category,
                content: content,
                fileUrl: fileData?.url || null,
                fileName: fileData?.name || null,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                displayDate: new Date().toLocaleDateString('vi-VN')
            });
            return true;
        } catch (e) { return false; }
    },

    // 3. Phát đề kiểm tra mới lên hệ thống
    publishQuiz: async (quizConfig) => {
        try {
            await firebase.firestore().collection("quizzes").add({
                ...quizConfig,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            return true;
        } catch (e) { return false; }
    }
};
