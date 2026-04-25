import { createBrowserRouter } from 'react-router-dom';

import App from '@/App';
import { RequireAuth } from '@/routes/RequireAuth';
import { RequireRole } from '@/routes/RequireRole';
import { AppIndexRedirect } from '@/routes/AppIndexRedirect';
import { AppShell } from '@/routes/shell/AppShell';
import { LoginPage } from '@/routes/LoginPage';
import { PhoneOnboardingPage } from '@/routes/PhoneOnboardingPage';
import { AdminDashboardPage } from '@/pages/admin/DashboardPage';
import { CreateTaskPage } from '@/pages/admin/CreateTaskPage';
import { MyTasksPage } from '@/pages/member/MyTasksPage';
import { TaskDetailPage } from '@/pages/TaskDetailPage';

export const router = createBrowserRouter([
  { path: '/', element: <App /> },
  { path: '/login', element: <LoginPage /> },
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
          <RequireRole role="admin">
            <CreateTaskPage />
          </RequireRole>
        ),
      },
      {
        path: 'dashboard',
        element: (
          <RequireRole role="admin">
            <AdminDashboardPage />
          </RequireRole>
        ),
      },
      { path: 'my-tasks', element: <MyTasksPage /> },
    ],
  },
]);

