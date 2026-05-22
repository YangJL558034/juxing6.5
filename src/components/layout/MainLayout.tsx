'use client';

import React, { useState, useEffect } from 'react';
import { Header, Sidebar } from '@/components/layout';
import { Dashboard } from '@/components/pages/Dashboard';
import { TodoPage } from '@/components/pages/TodoPage';
import { LeadsPage } from '@/components/pages/LeadsPage';
import { CustomersPage } from '@/components/pages/CustomersPage';
import { TasksPage } from '@/components/pages/TasksPage';
import { AssetsPage } from '@/components/pages/AssetsPage';
import UserManagePage from '@/components/pages/UserManagePage';
import SmtpConfigPage from '@/components/pages/SmtpConfigPage';
import OperationLogsPage from '@/components/pages/OperationLogsPage';
import { SettingsPage } from '@/components/pages/SettingsPage';
import TaskManagePage from '@/components/pages/TaskManagePage';
import DistributionPage from '@/components/pages/DistributionPage';
import { GeneratePage } from '@/components/pages/GeneratePage';
import SalaryPage from '@/components/pages/SalaryPage';
import ContactsPage from '@/components/pages/ContactsPage';
import ContractsPage from '@/components/pages/ContractsPage';
import InvoicesPage from '@/components/pages/InvoicesPage';
import VisitsPage from '@/components/pages/VisitsPage';
import ProductsPage from '@/components/pages/ProductsPage';
import FinancePage from '@/components/pages/FinancePage';
import PurchaseRequestsPage from '@/components/pages/PurchaseRequestsPage';
import ExpenseClaimsPage from '@/components/pages/ExpenseClaimsPage';
import OrganizationPage from '@/components/pages/OrganizationPage';
import PermissionPage from '@/components/pages/PermissionPage';
import ApprovalCenter from '@/components/pages/ApprovalCenter';
import FinanceReviewPage from '@/components/pages/FinanceReviewPage';
import AIChatPage from '@/app/ai-chat/page';
import NotificationCenterPage from '@/components/pages/NotificationCenterPage';

type PageKey = 'dashboard' | 'taskmanage' | 'distribution' | 'todo' | 'leads' | 'customers' | 'contacts' | 'contracts' | 'invoices' | 'followup' | 'products' | 'finance' | 'tasks' | 'salary' | 'generate' | 'ai-chat' | 'assets' | 'organization' | 'permission' | 'purchase-requests' | 'expense-claims' | 'approval-center' | 'finance-review' | 'smtp' | 'usermanage' | 'operation-logs' | 'settings' | 'notification-center';

interface MainLayoutProps {
  user?: {
    id: number;
    username: string;
    name: string;
    role: string;
    department?: string;
  };
}

export function MainLayout({ user }: MainLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activePage, setActivePage] = useState<PageKey>('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [permissions, setPermissions] = useState<string[]>([]);

  // 检测屏幕尺寸
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 获取用户权限
  useEffect(() => {
    const fetchPermissions = async () => {
      if (user?.role === 'admin') {
        // 管理员拥有所有权限
        setPermissions([
          'dashboard', 'taskmanage', 'distribution', 'todo', 'leads', 
          'customers', 'tasks', 'generate', 'assets', 'departments', 'usermanage', 'settings',
          'organization', 'permission', 'purchase-requests', 'expense-claims', 
          'approval-center', 'finance-review', 'notification-center'
        ]);
        return;
      }
      
      try {
        const res = await fetch(`/api/permissions/check?userId=${user?.id}`);
        if (res.ok) {
          const data = await res.json();
          setPermissions(data.permissions || []);
        }
      } catch (error) {
        console.error('获取权限失败:', error);
      }
    };
    
    fetchPermissions();
  }, [user]);

  // 检查是否有权限访问某页面
  const hasPermission = (page: string): boolean => {
    if (user?.role === 'admin') return true;
    return permissions.includes(page);
  };

  // 导航时检查权限
  const handleNavigate = (key: string) => {
    if (!hasPermission(key)) {
      alert('您没有权限访问此功能，请联系管理员开通');
      return;
    }
    setActivePage(key as PageKey);
  };

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard />;
      case 'taskmanage':
        return <TaskManagePage />;
      case 'distribution':
        return <DistributionPage />;
      case 'todo':
        return <TodoPage />;
      case 'leads':
        return <LeadsPage />;
      case 'customers':
        return <CustomersPage />;
      case 'contacts':
        return <ContactsPage />;
      case 'contracts':
        return <ContractsPage />;
      case 'invoices':
        return <InvoicesPage />;
      case 'followup':
        return <VisitsPage />;
      case 'products':
        return <ProductsPage />;
      case 'finance':
        return <FinancePage />;
      case 'tasks':
        return <TasksPage />;
      case 'salary':
        return <SalaryPage />;
      case 'generate':
        return <GeneratePage />;
      case 'ai-chat':
        return <AIChatPage />;
      case 'assets':
        return <AssetsPage />;
      case 'organization':
        return <OrganizationPage />;
      case 'permission':
        return <PermissionPage />;
      case 'purchase-requests':
        return <PurchaseRequestsPage />;
      case 'expense-claims':
        return <ExpenseClaimsPage />;
      case 'approval-center':
        return <ApprovalCenter />;
      case 'finance-review':
        return <FinanceReviewPage />;
      case 'usermanage':
        return <UserManagePage />;
      case 'smtp':
        return <SmtpConfigPage />;
      case 'operation-logs':
        return <OperationLogsPage />;
      case 'settings':
        return <SettingsPage />;
      case 'notification-center':
        return <NotificationCenterPage />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header 
        onToggleSidebar={() => {
          if (isMobile) {
            setMobileSidebarOpen(!mobileSidebarOpen);
          } else {
            setSidebarCollapsed(!sidebarCollapsed);
          }
        }} 
        user={user} 
      />
      
      {/* PC端侧边栏 */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        activeKey={activePage}
        onNavigate={handleNavigate}
        isMobile={false}
        permissions={permissions}
        isAdmin={user?.role === 'admin'}
      />
      
      {/* 移动端侧边栏 */}
      <Sidebar
        collapsed={false}
        onToggle={() => {}}
        activeKey={activePage}
        onNavigate={handleNavigate}
        isMobile={true}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
        permissions={permissions}
        isAdmin={user?.role === 'admin'}
      />
      
      <main
        className={`pt-14 transition-all duration-300 ${
          isMobile 
            ? 'pl-0' 
            : sidebarCollapsed 
              ? 'pl-16' 
              : 'pl-56'
        }`}
      >
        {renderPage()}
      </main>
    </div>
  );
}
