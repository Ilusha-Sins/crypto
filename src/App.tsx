import { useState } from 'react';
import { useAuth } from './auth/useAuth';
import DashboardPage from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';

type Screen = 'login' | 'register';

export default function App() {
  const { isAuthenticated, isLoading, logout, user } = useAuth();
  const [screen, setScreen] = useState<Screen>('login');

  if (isLoading) {
    return <div style={{ padding: 24 }}>Loading auth...</div>;
  }

  if (!isAuthenticated) {
    return screen === 'login' ? (
      <LoginPage onSwitchToRegister={() => setScreen('register')} />
    ) : (
      <RegisterPage onSwitchToLogin={() => setScreen('login')} />
    );
  }

  return <DashboardPage user={user} onLogout={logout} />;
}