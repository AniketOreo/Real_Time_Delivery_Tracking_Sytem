import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="navbar">
      <Link to="/" className="brand">
        <svg className="brand-mark" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path className="brand-path" d="M2 15C6 15 6 5 10 5C13 5 13 12 17 12" stroke="var(--route)" strokeWidth="1.6" strokeLinecap="round" />
          <circle className="brand-dot" cx="17" cy="12" r="2.4" fill="var(--route)" />
        </svg>
        <span>Ship<span className="brand-nest">Nest</span></span>
      </Link>
      <nav>
        {!user && (
          <>
            <Link to="/login">Log in</Link>
            <Link to="/register">Sign up</Link>
          </>
        )}
        {user?.role === 'customer' && (
          <>
            <Link to="/customer/place-order">Place order</Link>
            <Link to="/customer/history">Order history</Link>
          </>
        )}
        {user?.role === 'agent' && <Link to="/agent">Assigned deliveries</Link>}
        {user?.role === 'admin' && (
          <>
            <Link to="/admin/orders">Manage orders</Link>
            <Link to="/admin/users">Manage users</Link>
            <Link to="/admin/monitor">Live monitor</Link>
            <Link to="/admin/reports">Reports</Link>
          </>
        )}
        {user && (
          <>
            {user.role === 'customer' && <NotificationBell />}
            <span className="user-chip">{user.name} · {user.role}</span>
            <button onClick={handleLogout}>Log out</button>
          </>
        )}
      </nav>
    </div>
  );
}
