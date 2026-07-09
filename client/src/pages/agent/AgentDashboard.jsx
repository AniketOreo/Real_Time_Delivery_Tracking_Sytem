import { useEffect, useRef, useState } from 'react';
import api from '../../api/axios';
import { useSocket } from '../../context/SocketContext';
import StatusBadge from '../../components/StatusBadge';

const NEXT_STATUS = {
  ready_to_ship: 'in_transit',
  in_transit: 'out_for_delivery',
  out_for_delivery: 'delivered'
};
const NEXT_LABEL = {
  ready_to_ship: 'Mark in transit',
  in_transit: 'Mark out for delivery',
  out_for_delivery: 'Mark delivered'
};

export default function AgentDashboard() {
  const socket = useSocket();
  const [orders, setOrders] = useState([]);
  const [sharingId, setSharingId] = useState(null);
  const watchIdRef = useRef(null);

  function loadOrders() {
    api.get('/orders/agent/mine').then((res) => setOrders(res.data.orders));
  }

  useEffect(() => {
    loadOrders();
    return () => stopSharing();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function advanceStatus(order) {
    const next = NEXT_STATUS[order.status];
    if (!next) return;
    await api.patch(`/orders/${order._id}/status`, { status: next });
    loadOrders();
  }

  async function markException(order, status) {
    await api.patch(`/orders/${order._id}/status`, { status, note: 'Reported by agent' });
    loadOrders();
  }

  function startSharing(orderId) {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported on this device.');
      return;
    }
    stopSharing();
    setSharingId(orderId);
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        socket?.emit('agent:locationUpdate', {
          orderId,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        });
      },
      (err) => console.error('Location error:', err.message),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );
  }

  function stopSharing() {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setSharingId(null);
  }

  return (
    <div className="container">
      <h2>Assigned deliveries</h2>
      {orders.length === 0 && <p className="muted">No active deliveries assigned to you right now.</p>}

      {orders.map((o) => (
        <div key={o._id} className="card">
          <div className="row" style={{ alignItems: 'center' }}>
            <div>
              <strong>{o.orderNumber}</strong>
              <div className="muted">{o.pickupAddress} → {o.dropoffAddress}</div>
              <div className="muted">Customer: {o.customer?.name} {o.customer?.phone && `· ${o.customer.phone}`}</div>
            </div>
            <StatusBadge status={o.status} />
          </div>

          <div className="row" style={{ marginTop: 12 }}>
            {NEXT_STATUS[o.status] && (
              <button className="primary" onClick={() => advanceStatus(o)}>{NEXT_LABEL[o.status]}</button>
            )}
            {o.status === 'out_for_delivery' && (
              <button className="danger" onClick={() => markException(o, 'rto')}>Report failed delivery</button>
            )}

            {sharingId === o._id ? (
              <button onClick={stopSharing}>Stop sharing location</button>
            ) : (
              <button onClick={() => startSharing(o._id)}>Share live location</button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
