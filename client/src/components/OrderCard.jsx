import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge';

export default function OrderCard({ order, linkTo }) {
  return (
    <div className="card">
      <div className="row" style={{ alignItems: 'center' }}>
        <div>
          <strong>{order.orderNumber}</strong>
          <div className="muted">{order.pickupAddress} → {order.dropoffAddress}</div>
        </div>
        <StatusBadge status={order.status} />
        {linkTo && (
          <div style={{ textAlign: 'right' }}>
            <Link to={linkTo}>View details</Link>
          </div>
        )}
      </div>
    </div>
  );
}
