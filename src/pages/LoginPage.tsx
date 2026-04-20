import { FormEvent, useState } from 'react';
import { useAuth } from '../auth/useAuth';

type Props = {
  onSuccess?: () => void;
  onSwitchToRegister?: () => void;
};

export function LoginPage({ onSuccess, onSwitchToRegister }: Props) {
  const { login } = useAuth();
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('123456');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login(email, password);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: '40px auto' }}>
      <h2>Login</h2>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 12 }}>
          <label>Email</label>
          <input
            style={{ width: '100%', padding: 8 }}
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>Password</label>
          <input
            style={{ width: '100%', padding: 8 }}
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>

        {error ? <p style={{ color: 'red' }}>{error}</p> : null}

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Loading...' : 'Login'}
        </button>
      </form>

      <div style={{ marginTop: 12 }}>
        <button type="button" onClick={onSwitchToRegister}>
          Go to register
        </button>
      </div>
    </div>
  );
}