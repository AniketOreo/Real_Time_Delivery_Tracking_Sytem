import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api/axios';
import { useSocket } from '../../context/SocketContext';
import StatusBadge from '../../components/StatusBadge';
import MapView from '../../components/MapView';

export default function TrackOrder() {
  const { id } = useParams();
  const socket = useSocket();
  const [order, setOrder] = useState(null);
  const [liveLocation, setLiveLocation] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/orders/${id}`)
      .then((res) => {
        setOrder(res.data.order);
        if (res.data.order.currentLocation?.lat) setLiveLocation(res.data.order.currentLocation);
      })
      .catch((err) => setError(err.response?.data?.message || 'Could not load this order.'));
  }, [id]);

  useEffect(() => {
    if (!socket) return;
    socket.emit('joinOrder', id);

    function onLocation(payload) {
      if (payload.orderId === id) setLiveLocation(payload);
    }
    function onStatus(payload) {
      if (payload.orderId === id) {
        setOrder((prev) => prev && { ...prev, status: payload.status, statusHistory: payload.statusHistory || prev.statusHistory });
      }
    }

    socket.on('order:locationUpdate', onLocation);
    socket.on('order:statusUpdate', onStatus);

    return () => {
      socket.emit('leaveOrder', id);
      socket.off('order:locationUpdate', onLocation);
      socket.off('order:statusUpdate', onStatus);
    };
  }, [socket, id]);

  if (error) return <div className="container error-text">{error}</div>;
  if (!order) return <div className="container muted">Loading…</div>;

  const mapCenter = liveLocation || order.pickupLocation;
  const markers = [
    { id: 'pickup', ...order.pickupLocation, label: 'P', title: 'Pickup' },
    { id: 'dropoff', ...order.dropoffLocation, label: 'D', title: 'Dropoff' }
  ];
  if (liveLocation) markers.push({ id: 'agent', lat: liveLocation.lat, lng: liveLocation.lng, label: 'A', title: 'Agent location' });

  return (
    <div className="container">
      <div className="row" style={{ alignItems: 'center' }}>
        <h2>{order.orderNumber}</h2>
        <StatusBadge status={order.status} />
      </div>
      <p className="muted">{order.pickupAddress} → {order.dropoffAddress}</p>

      <MapView center={mapCenter} markers={markers} />

      <div className="card" style={{ marginTop: 16 }}>
        <strong>Status timeline</strong>
        {order.statusHistory.slice().reverse().map((h, i) => (
          <div key={i} className="muted" style={{ padding: '4px 0' }}>
            {new Date(h.timestamp).toLocaleString()} — <StatusBadge status={h.status} /> {h.note ? `(${h.note})` : ''}
          </div>
        ))}
      </div>

      {order.assignedAgent && (
        <div className="card">
          <strong>Delivery agent:</strong> {order.assignedAgent.name} {order.assignedAgent.phone && `· ${order.assignedAgent.phone}`}
        </div>
      )}
    </div>
  );
}
