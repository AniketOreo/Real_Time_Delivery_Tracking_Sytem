import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="container">
      <h2>Delivery tracking system</h2>
      {!user && (
        <p>
          <Link to="/login">Log in</Link> or <Link to="/register">sign up</Link> to place
          an order, run deliveries, or manage the platform.
        </p>
      )}
      {user?.role === 'customer' && <p><Link to="/customer/place-order">Place a new order</Link> or view your <Link to="/customer/history">order history</Link>.</p>}
      {user?.role === 'agent' && <p>Go to your <Link to="/agent">assigned deliveries</Link>.</p>}
      {user?.role === 'admin' && <p>Go to <Link to="/admin/orders">manage orders</Link>, <Link to="/admin/monitor">the live monitor</Link>, or <Link to="/admin/reports">reports</Link>.</p>}
    </div>
  );
}
