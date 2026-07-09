import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', role: 'customer' });
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      const user = await register(form);
      if (user.role === 'customer') navigate('/customer/history');
      else if (user.role === 'agent') navigate('/agent');
      else navigate('/admin/orders');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create account.');
    }
  }

  return (
    <div className="container" style={{ maxWidth: 420 }}>
      <h2>Create an account</h2>
      <form onSubmit={handleSubmit} className="card">
        <div className="form-group">
          <label htmlFor="name">Name</label>
          <input id="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" required value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input id="password" type="password" required minLength={6} value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </div>
        <div className="form-group">
          <label htmlFor="phone">Phone</label>
          <input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div className="form-group">
          <label htmlFor="role">Account type</label>
          <select id="role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="customer">Customer</option>
            <option value="agent">Delivery agent</option>
            <option value="admin">Admin</option>
          </select>
          <div className="muted">
            Dev note: role selection is open here for demo purposes only. Lock this
            down before production — see README "Hardening before production".
          </div>
        </div>
        {error && <div className="error-text">{error}</div>}
        <button type="submit" className="primary">Sign up</button>
      </form>
      <p className="muted">Already have an account? <Link to="/login">Log in</Link></p>
    </div>
  );
}
