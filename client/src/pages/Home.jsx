import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="container">
      <div className="hero">
        <span className="hero-eyebrow">
          <span className="pulse" /> Live tracking, end to end
        </span>
        <h1>Every order, on the map, in real time.</h1>
        <p>
          Place an order, watch it move, and know exactly when it lands —
          for customers, agents, and admins alike.
        </p>

        <div className="hero-links">
          {!user && (
            <>
              <Link to="/login"><button>Log in</button></Link>
              <Link to="/register"><button className="primary">Sign up</button></Link>
            </>
          )}
          {user?.role === 'customer' && (
            <>
              <Link to="/customer/place-order"><button className="primary">Place a new order</button></Link>
              <Link to="/customer/history"><button>View order history</button></Link>
            </>
          )}
          {user?.role === 'agent' && (
            <Link to="/agent"><button className="primary">Go to assigned deliveries</button></Link>
          )}
          {user?.role === 'admin' && (
            <>
              <Link to="/admin/orders"><button className="primary">Manage orders</button></Link>
              <Link to="/admin/monitor"><button>Live monitor</button></Link>
              <Link to="/admin/reports"><button>Reports</button></Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
