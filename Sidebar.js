const MENU = [
    { id: 'giaoan', name: 'Giáo án', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
    { id: 'baigiang', name: 'Bài giảng', icon: 'M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z' },
    { id: 'dekiemtra', name: 'Đề kiểm tra', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
    { id: 'baocao', name: 'Báo cáo điểm', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' }
];

function Sidebar({ tab, setTab, user, auth }) {
    return (
        <aside className="w-72 bg-white border-r flex flex-col p-8 z-50 shadow-sm">
            {/* Logo Thương hiệu */}
            <div className="mb-12 flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-bold shadow-lg">P</div>
                <span className="font-black text-2xl text-slate-800 tracking-tighter italic">Giviso Pro</span>
            </div>

            {/* Danh sách Menu điều hướng */}
            <nav className="flex-1 space-y-3">
                {MENU.map(m => (
                    <button 
                        key={m.id} 
                        onClick={() => setTab(m.id)} 
                        className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-bold transition-all ${
                            tab === m.id ? 'sidebar-active text-white' : 'text-slate-400 hover:bg-slate-50'
                        }`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={m.icon}/>
                        </svg>
                        {m.name}
                    </button>
                ))}
            </nav>

            {/* Thông tin User & Nút thoát */}
            <div className="mt-auto pt-6 border-t flex items-center gap-3">
                {user?.photoURL && (
                    <img src={user.photoURL} className="w-9 h-9 rounded-full border-2 border-slate-100 shadow-sm" alt="Avatar" />
                )}
                <div className="overflow-hidden">
                    <p className="text-[10px] font-black truncate text-slate-900 uppercase">
                        {user?.displayName || "Giáo viên"}
                    </p>
                    <button 
                        onClick={() => auth.signOut()} 
                        className="text-[9px] font-bold text-rose-500 uppercase hover:underline"
                    >
                        Thoát hệ thống
                    </button>
                </div>
            </div>
        </aside>
    );
}
