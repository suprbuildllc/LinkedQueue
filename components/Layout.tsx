import React from 'react';
import { 
  LayoutDashboard, 
  PenTool, 
  Settings, 
  Activity, 
  LogOut, 
  Bell,
  Menu,
  X,
  Search,
  ChevronDown
} from 'lucide-react';
import { User } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, user, activeTab, onTabChange, onLogout }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'drafts', label: 'Drafts', icon: <PenTool className="w-4 h-4" /> },
    { id: 'activity', label: 'Activity', icon: <Activity className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  const activePageLabel = navItems.find(n => n.id === activeTab)?.label || 'LinkedQueue';

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-56 bg-white border-r border-slate-200 fixed h-full z-20">
        <div className="h-14 border-b border-slate-100 flex items-center px-4 gap-3">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white shadow-sm shadow-blue-200 text-sm">
            LQ
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-900">LinkedQueue</span>
        </div>
        
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                activeTab === item.id 
                  ? 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-100' 
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-slate-100">
          <div className="flex items-center gap-3 px-3 py-2 bg-slate-50 rounded-lg border border-slate-100 hover:border-slate-200 transition-colors cursor-pointer group">
            <img 
              src={user.avatar_url} 
              alt={user.name} 
              className="w-8 h-8 rounded-full bg-slate-200 object-cover border border-white shadow-sm"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-900 truncate group-hover:text-blue-700 transition-colors">{user.name}</p>
              <p className="text-[10px] text-slate-500 truncate">{user.credits_balance} credits</p>
            </div>
            <button 
              onClick={onLogout}
              className="text-slate-400 hover:text-red-500 transition-colors"
              title="Logout"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Column */}
      <div className="flex-1 md:ml-56 flex flex-col min-h-screen">
        
        {/* Top Bar - Sticky */}
        <header className="bg-white border-b border-slate-200 h-14 px-4 md:px-8 flex items-center justify-between sticky top-0 z-10 shadow-sm/50">
           <div className="flex items-center gap-3 md:hidden">
              <button onClick={() => setIsMobileMenuOpen(true)} className="text-slate-600 p-1 -ml-2 hover:bg-slate-100 rounded-md">
                <Menu className="w-5 h-5" />
              </button>
              <span className="font-bold text-slate-900">LinkedQueue</span>
           </div>

           <div className="hidden md:flex items-center gap-4">
              <h1 className="text-base font-bold text-slate-900">{activePageLabel}</h1>
           </div>

           <div className="flex items-center gap-3">
              {/* Search Bar (Desktop) */}
              <div className="hidden lg:block relative">
                 <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                 <input 
                   type="text"
                   placeholder="Search..." 
                   className="pl-8 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 w-56 transition-all focus:bg-white"
                 />
              </div>

              <div className="h-5 w-px bg-slate-200 mx-1 hidden md:block"></div>

              <button className="relative p-1.5 text-slate-400 hover:text-blue-600 transition-colors rounded-full hover:bg-slate-50">
                <Bell className="w-4 h-4" />
                <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full border border-white"></span>
              </button>

              <button className="hidden md:flex items-center gap-2 pl-1 pr-1 py-1 rounded-full hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all">
                 <img src={user.avatar_url} alt="Profile" className="w-6 h-6 rounded-full bg-slate-200 object-cover" />
                 <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>
           </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
          <div className="absolute top-0 left-0 bottom-0 w-3/4 max-w-xs bg-white shadow-xl flex flex-col animate-in slide-in-from-left duration-200">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center h-14">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white text-sm">
                  LQ
                </div>
                <span className="font-bold text-slate-900">LinkedQueue</span>
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="p-3 space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onTabChange(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium ${
                    activeTab === item.id 
                      ? 'bg-blue-50 text-blue-700' 
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </nav>
            <div className="mt-auto p-4 border-t border-slate-100">
               <div className="flex items-center gap-3">
                 <img src={user.avatar_url} className="w-9 h-9 rounded-full" />
                 <div>
                   <p className="font-medium text-slate-900 text-sm">{user.name}</p>
                   <p className="text-xs text-slate-500">{user.email}</p>
                 </div>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;