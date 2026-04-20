import { FormEvent, useState } from 'react';
import { useAuth } from '../auth/useAuth';

type Props = {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
};

export function RegisterPage({ onSuccess, onSwitchToLogin }: Props) {
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await register(email, password);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Register failed');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: '40px auto' }}>
      <h2>Register</h2>

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
          {isSubmitting ? 'Loading...' : 'Register'}
        </button>
      </form>

      <div style={{ marginTop: 12 }}>
        <button type="button" onClick={onSwitchToLogin}>
          Go to login
        </button>
      </div>
    </div>
  );
}