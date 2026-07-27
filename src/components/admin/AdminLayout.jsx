import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, BookOpen, FileQuestion,
  LogOut, Settings, Menu, X, Users, Calendar, Camera, TrendingUp, Layers, FileText, ClipboardCheck, Award, Shield, Activity
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import api from '../../api/axios';

function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [userPermissions, setUserPermissions] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const allMenuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin', permission: null },
    { icon: Shield, label: 'User Management', path: '/admin/users', permission: 'userManagement.read' },
    { icon: BookOpen, label: 'Exams', path: '/admin/exams', permission: 'examManagement.read' },
    { icon: FileQuestion, label: 'Question Bank', path: '/admin/questions', permission: 'questionManagement.read' },
    { icon: Users, label: 'Students', path: '/admin/students', permission: 'userManagement.read' },
    { icon: Layers, label: 'Batches', path: '/admin/batches', permission: 'userManagement.read' },
    { icon: Calendar, label: 'Scheduling', path: '/admin/scheduling', permission: 'scheduling.read' },
    { icon: Activity, label: 'Live Exams', path: '/admin/live', permission: 'examManagement.read' },
    { icon: Camera, label: 'Proctoring', path: '/admin/proctoring', permission: 'examManagement.read' },
    { icon: TrendingUp, label: 'Analytics', path: '/admin/analytics', permission: 'analytics.read' },
    { icon: FileText, label: 'Reports', path: '/admin/reports', permission: 'reports.read' },
    { icon: Award, label: 'Certificates', path: '/admin/certificates', permission: 'examManagement.read' },
    { icon: ClipboardCheck, label: 'Student Answers', path: '/admin/student-answers', permission: 'analytics.read' },
  ];

  useEffect(() => {
    fetchUserPermissions();
  }, []);

  const fetchUserPermissions = async () => {
    try {
      const response = await api.get('/admin/user-permissions');
      setUserPermissions(response.data.permissions);
    } catch (error) {
      console.error('Error fetching user permissions:', error);
    }
  };

  const menuItems = allMenuItems.filter(item => {
    if (!item.permission) return true;
    if (!userPermissions) return false;
    const [module, action] = item.permission.split('.');
    return userPermissions[module]?.[action] === true;
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex" style={{ background: '#eff6ff' }}>
      {/* Sidebar */}
      <aside
        className={`text-white w-64 fixed inset-y-0 left-0 transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 transition-transform duration-200 ease-in-out z-30 flex flex-col`}
        style={{ background: 'linear-gradient(180deg, #0f172a 0%, #0c1a3a 55%, #0e2a5c 100%)' }}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-blue-900/40 flex-shrink-0">
          <div className="flex items-center gap-3">
            <img src="/beeja-logo.png" alt="Beeja Academy" className="w-9 h-9 rounded-xl object-contain shadow-lg bg-white/10" />
            <div>
              <span className="text-sm font-bold tracking-wide text-white">Beeja Academy</span>
              <p className="text-xs leading-none mt-0.5" style={{ color: '#60a5fa80' }}>Management Portal</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden text-blue-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto scrollbar-blue">
          <p className="text-xs font-semibold uppercase tracking-widest px-3 mb-3" style={{ color: '#3b82f660' }}>Navigation</p>
          <ul className="space-y-0.5">
            {menuItems.map((item) => {
              const isActive =
                location.pathname === item.path ||
                (item.path !== '/admin' && location.pathname.startsWith(item.path));
              return (
                <li key={item.path}>
                  <button
                    onClick={() => { navigate(item.path); setSidebarOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 text-left group ${
                      isActive ? 'text-white shadow-lg' : 'hover:bg-white/8'
                    }`}
                    style={
                      isActive
                        ? { background: 'linear-gradient(135deg, #2563eb, #0891b2)', boxShadow: '0 4px 14px rgba(37,99,235,0.35)' }
                        : {}
                    }
                  >
                    <item.icon
                      className={`flex-shrink-0 transition-colors ${isActive ? 'text-white' : 'text-blue-400 group-hover:text-blue-200'}`}
                      style={{ width: '17px', height: '17px' }}
                    />
                    <span className={`text-sm font-medium truncate ${isActive ? 'text-white' : 'text-blue-200/70 group-hover:text-white'}`}>
                      {item.label}
                    </span>
                    {isActive && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-300 flex-shrink-0" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User + Logout */}
        <div className="px-3 py-4 border-t border-blue-900/40 flex-shrink-0">
          <div className="flex items-center gap-3 px-3 py-2.5 mb-1 rounded-xl bg-white/5 border border-white/5">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold text-white shadow"
              style={{ background: 'linear-gradient(135deg, #2563eb, #0891b2)' }}
            >
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
              <p className="text-xs truncate" style={{ color: '#60a5fa60' }}>Administrator</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 mt-1 text-left"
            style={{ color: '#93c5fd80' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.12)'; e.currentTarget.style.color = '#fca5a5'; }}
            onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = '#93c5fd80'; }}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 md:ml-64 min-h-screen" style={{ background: '#eff6ff' }}>
        {/* Mobile Header */}
        <header
          className="md:hidden px-4 py-3 flex items-center gap-3"
          style={{ background: 'linear-gradient(135deg, #0f172a, #1e40af)', borderBottom: '1px solid rgba(59,130,246,0.2)' }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-blue-300 hover:text-white transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #2563eb, #0891b2)' }}
            >
              <BookOpen className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-semibold text-white text-sm">Exam Admin</span>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6 md:p-8">
          {children}
        </main>
      </div>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}

export default AdminLayout;
