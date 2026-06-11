import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, App as AntApp } from 'antd';
import koKR from 'antd/locale/ko_KR';
import { useAuthStore } from './store/authStore';
import Login from './pages/Login';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  return user ? <>{children}</> : <Navigate to="/login" replace />;
}

function Dashboard() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  return (
    <div style={{ padding: 40 }}>
      <h2>안녕하세요, {user?.userName}님</h2>
      <button onClick={logout}>로그아웃</button>
    </div>
  );
}

export default function App() {
  return (
    <ConfigProvider locale={koKR}>
      <AntApp>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </AntApp>
    </ConfigProvider>
  );
}
