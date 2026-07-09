import { useEffect, useState } from 'react';
import api from '../../api/axios';
import OrderCard from '../../components/OrderCard';

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/orders/mine').then((res) => setOrders(res.data.orders)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="container">
      <h2>Your orders</h2>
      {loading && <p className="muted">Loading…</p>}
      {!loading && orders.length === 0 && <p className="muted">No orders yet. Place your first order to get started.</p>}
      {orders.map((o) => (
        <OrderCard key={o._id} order={o} linkTo={`/customer/track/${o._id}`} />
      ))}
    </div>
  );
}
