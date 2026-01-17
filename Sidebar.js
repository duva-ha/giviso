const MENU = [
    { id: 'giaoan', name: 'Giáo án', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253', color: 'from-blue-500 to-indigo-600' },
    { id: 'baigiang', name: 'Bài giảng', icon: 'M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z', color: 'from-emerald-500 to-teal-600' },
    { id: 'dekiemtra', name: 'Đề kiểm tra', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01', color: 'from-orange-500 to-rose-600' },
    { id: 'baocao', name: 'Báo cáo điểm', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', color: 'from-purple-500 to-pink-600' }
];

function Sidebar({ tab, setTab, user, auth }) {
    return (
        <aside className="w-80 bg-slate-900 flex flex-col p-6 z-50 relative overflow-hidden shadow-[10px_0_30px_rgba(0,0,0,0.1)]">
            {/* Hiệu ứng ánh sáng nền trang trí */}
            <div className="absolute -top-24 -left-24 w-64 h-64 bg-blue-600/20 rounded-full blur-[100px]"></div>
            <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-purple-600/10 rounded-full blur-[100px]"></div>

            {/* Logo Thương hiệu */}
            <div className="mb-12 flex items-center gap-4 px-2 relative z-10">
                <div className="w-12 h-12 bg-gradient-to-tr from-blue-400 to-blue-700 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-500/40 rotate-3">
                    G
                </div>
                <div>
                    <span className="block font-black text-2xl text-white tracking-tighter leading-none italic">Giviso Pro</span>
                    <span className="text-[8px] font-bold text-blue-400 uppercase tracking-[0.3em] ml-1">Dashboard 2026</span>
                </div>
            </div>

            {/* Danh sách Menu */}
            <nav className="flex-1 space-y-2 relative z-10">
                {MENU.map(m => {
                    const isActive = tab === m.id;
                    return (
                        <button 
                            key={m.id} 
                            onClick={() => setTab(m.id)} 
                            className={`w-full group flex items-center gap-4 px-5 py-4 rounded-[1.25rem] transition-all duration-300 relative ${
                                isActive 
                                ? `bg-gradient-to-r ${m.color} text-white shadow-xl shadow-black/20 scale-[1.02]` 
                                : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'
                            }`}
                        >
                            {/* Icon với hiệu ứng Glow khi Active */}
                            <div className={`p-2 rounded-xl transition-colors ${isActive ? 'bg-white/20' : 'bg-slate-800 group-hover:bg-slate-700'}`}>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={m.icon}/>
                                </svg>
                            </div>
                            
                            <span className={`font-bold text-sm tracking-tight ${isActive ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'}`}>
                                {m.name}
                            </span>

                            {/* Dấu chỉ thị bên phải */}
                            {isActive && (
                                <div className="absolute right-4 w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_10px_white]"></div>
                            )}
                        </button>
                    );
                })}
            </nav>

            {/* Thông tin User & Nút thoát */}
            <div className="mt-auto pt-6 border-t border-white/10 relative z-10">
                <div className="bg-white/5 p-4 rounded-3xl border border-white/5 backdrop-blur-md">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="relative">
                            <img src={user?.photoURL} className="w-10 h-10 rounded-2xl border-2 border-blue-500/50 p-0.5" alt="Avatar" />
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-4 border-slate-900 rounded-full"></div>
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-[11px] font-black truncate text-white uppercase tracking-wider">
                                {user?.displayName || "Giáo viên"}
                            </p>
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Administrator</p>
                        </div>
                    </div>
                    
                    <button 
                        onClick={() => auth.signOut()} 
                        className="w-full py-3 rounded-xl bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white text-[10px] font-black uppercase tracking-widest transition-all duration-300 border border-rose-500/20"
                    >
                        Thoát hệ thống
                    </button>
                </div>
            </div>
        </aside>
    );
}
