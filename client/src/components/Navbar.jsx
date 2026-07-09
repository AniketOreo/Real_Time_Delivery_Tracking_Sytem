import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="navbar">
      <Link to="/"><strong>Delivery tracking</strong></Link>
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
            <span className="muted">{user.name} ({user.role})</span>
            <button onClick={handleLogout}>Log out</button>
          </>
        )}
      </nav>
    </div>
  );
}
