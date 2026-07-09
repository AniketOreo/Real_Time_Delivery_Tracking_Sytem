import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      const user = await login(form.email, form.password);
      if (user.role === 'customer') navigate('/customer/history');
      else if (user.role === 'agent') navigate('/agent');
      else navigate('/admin/orders');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not log in.');
    }
  }

  return (
    <div className="container" style={{ maxWidth: 420 }}>
      <h2>Log in</h2>
      <form onSubmit={handleSubmit} className="card">
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" required value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input id="password" type="password" required value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </div>
        {error && <div className="error-text">{error}</div>}
        <button type="submit" className="primary">Log in</button>
      </form>
      <p className="muted">No account? <Link to="/register">Sign up</Link></p>
    </div>
  );
}
