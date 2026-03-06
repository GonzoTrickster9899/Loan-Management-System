import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { ROLES, ROLE_LABELS, getInitials } from '../../utils/helpers';
import {
  HiOutlineHome,
  HiOutlineDocumentText,
  HiOutlineUsers,
  HiOutlineCog6Tooth,
  HiOutlineChartBarSquare,
  HiOutlineArrowLeftOnRectangle,
  HiOutlineBars3,
  HiOutlineXMark,
  HiOutlineSun,
  HiOutlineMoon,
  HiOutlineBell,
  HiOutlineShieldCheck,
  HiOutlinePlusCircle,
  HiOutlineClipboardDocumentList,
  HiOutlineUserCircle,
  HiOutlineIdentification,
} from 'react-icons/hi2';

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: HiOutlineHome,
      roles: [ROLES.ADMIN, ROLES.LOAN_OFFICER, ROLES.MANAGER, ROLES.CUSTOMER],
    },
    {
      label: 'Apply for Loan',
      path: '/loans/new',
      icon: HiOutlinePlusCircle,
      roles: [ROLES.CUSTOMER],
    },
    {
      label: 'My Loans',
      path: '/loans',
      icon: HiOutlineDocumentText,
      roles: [ROLES.CUSTOMER],
    },
    {
      label: 'All Loans',
      path: '/loans',
      icon: HiOutlineClipboardDocumentList,
      roles: [ROLES.ADMIN, ROLES.LOAN_OFFICER, ROLES.MANAGER],
    },
    {
      label: 'Customers',
      path: '/customers',
      icon: HiOutlineIdentification,
      roles: [ROLES.ADMIN, ROLES.LOAN_OFFICER, ROLES.MANAGER],
    },
    {
      label: 'User Management',
      path: '/admin/users',
      icon: HiOutlineUsers,
      roles: [ROLES.ADMIN],
    },
    {
      label: 'Activity Logs',
      path: '/admin/logs',
      icon: HiOutlineChartBarSquare,
      roles: [ROLES.ADMIN],
    },
    {
      label: 'Profile',
      path: '/profile',
      icon: HiOutlineUserCircle,
      roles: [ROLES.ADMIN, ROLES.LOAN_OFFICER, ROLES.MANAGER, ROLES.CUSTOMER],
    },
    {
      label: 'Security',
      path: '/security',
      icon: HiOutlineShieldCheck,
      roles: [ROLES.ADMIN, ROLES.LOAN_OFFICER, ROLES.MANAGER, ROLES.CUSTOMER],
    },
  ];

  const filteredNav = navItems.filter((item) => item.roles.includes(user?.role));

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-base-300/50">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
          <span className="text-xl font-display font-bold text-primary-content">LV</span>
        </div>
        <div>
          <h1 className="font-display font-bold text-lg leading-none">LoanVault</h1>
          <p className="text-xs text-base-content/50 mt-0.5">Management System</p>
        </div>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {filteredNav.map((item) => (
          <NavLink
            key={item.path + item.label}
            to={item.path}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-primary text-primary-content shadow-md shadow-primary/25'
                  : 'text-base-content/70 hover:bg-base-300/50 hover:text-base-content'
              }`
            }
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User & Logout */}
      <div className="p-4 border-t border-base-300/50">
        <div className="flex items-center gap-3 mb-3 px-2">
          <div className="avatar placeholder">
            <div className="bg-primary text-primary-content rounded-full w-9 h-9">
              <span className="text-xs font-bold">{getInitials(user?.firstName, user?.lastName)}</span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{user?.firstName} {user?.lastName}</p>
            <p className="text-xs text-base-content/50">{ROLE_LABELS[user?.role]}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="btn btn-ghost btn-sm w-full justify-start text-error hover:bg-error/10 gap-2"
        >
          <HiOutlineArrowLeftOnRectangle className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-base-200">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-base-100 border-r border-base-300/50 flex flex-col transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <div className="lg:ml-64 min-h-screen flex flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-base-100/80 backdrop-blur-xl border-b border-base-300/50">
          <div className="flex items-center justify-between px-4 lg:px-8 h-16">
            <button
              className="btn btn-ghost btn-sm lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <HiOutlineBars3 className="w-6 h-6" />
            </button>

            <div className="flex-1" />

            <div className="flex items-center gap-2">
              <button onClick={toggleTheme} className="btn btn-ghost btn-sm btn-circle">
                {theme === 'loanlight' ? (
                  <HiOutlineMoon className="w-5 h-5" />
                ) : (
                  <HiOutlineSun className="w-5 h-5" />
                )}
              </button>
              <button className="btn btn-ghost btn-sm btn-circle">
                <div className="indicator">
                  <HiOutlineBell className="w-5 h-5" />
                  <span className="indicator-item badge badge-primary badge-xs"></span>
                </div>
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
