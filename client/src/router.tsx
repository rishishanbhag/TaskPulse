import { createBrowserRouter } from 'react-router-dom';

import App from '@/App';
import { SettingsPage } from '@/pages/admin/SettingsPage';
import { RequireAuth } from '@/routes/RequireAuth';
import { RequireRole } from '@/routes/RequireRole';
import { AppIndexRedirect } from '@/routes/AppIndexRedirect';
import { AppShell } from '@/routes/shell/AppShell';
import { LoginPage } from '@/routes/LoginPage';
import { PhoneOnboardingPage } from '@/routes/PhoneOnboardingPage';
import { SignupPage } from '@/routes/SignupPage';
import { AdminDashboardPage } from '@/pages/admin/DashboardPage';
import { CreateTaskPage } from '@/pages/admin/CreateTaskPage';
import { MyTasksPage } from '@/pages/member/MyTasksPage';
import { TaskDetailPage } from '@/pages/TaskDetailPage';
import type { UserRole } from '@/hooks/types';

const manageRoles: UserRole[] = ['owner', 'admin', 'manager'];
const staffNavRoles: UserRole[] = ['owner', 'admin', 'manager'];

export const router = createBrowserRouter([
  { path: '/', element: <App /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/signup', element: <SignupPage /> },
  { path: '/onboarding/phone', element: <RequireAuth><PhoneOnboardingPage /></RequireAuth> },
  {
    path: '/app',
    element: (
      <RequireAuth>
        <AppShell />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <AppIndexRedirect /> },
      { path: 'tasks/:id', element: <TaskDetailPage /> },
      {
        path: 'admin/tasks/new',
        element: (
          <RequireRole roles={manageRoles}>
            <CreateTaskPage />
          </RequireRole>
        ),
      },
      {
        path: 'dashboard',
        element: (
          <RequireRole roles={manageRoles}>
            <AdminDashboardPage />
          </RequireRole>
        ),
      },
      {
        path: 'settings',
        element: (
          <RequireRole roles={staffNavRoles}>
            <SettingsPage />
          </RequireRole>
        ),
      },
      { path: 'my-tasks', element: <MyTasksPage /> },
    ],
  },
]);
