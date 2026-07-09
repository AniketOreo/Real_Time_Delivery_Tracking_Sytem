import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { useSocket } from '../../context/SocketContext';
import MapView from '../../components/MapView';
import StatusBadge from '../../components/StatusBadge';

const DEFAULT_CENTER = { lat: 20.5937, lng: 78.9629 }; // India, used until a live location arrives

export default function LiveMonitor() {
  const socket = useSocket();
  const [orders, setOrders] = useState([]);

  function load() {
    api.get('/orders').then((res) =>
      setOrders(res.data.orders.filter((o) => ['in_transit', 'out_for_delivery'].includes(o.status)))
    );
  }

  useEffect(load, []);

  useEffect(() => {
    if (!socket) return;
    function onLocation(payload) {
      setOrders((prev) =>
        prev.map((o) => (o._id === payload.orderId ? { ...o, currentLocation: payload } : o))
      );
    }
    function onUpdated() {
      load();
    }
    socket.on('order:locationUpdate', onLocation);
    socket.on('order:updated', onUpdated);
    return () => {
      socket.off('order:locationUpdate', onLocation);
      socket.off('order:updated', onUpdated);
    };
  }, [socket]);

  const markers = orders
    .filter((o) => o.currentLocation?.lat)
    .map((o) => ({ id: o._id, lat: o.currentLocation.lat, lng: o.currentLocation.lng, label: 'A', title: o.orderNumber }));

  const center = markers[0] || DEFAULT_CENTER;

  return (
    <div className="container">
      <h2>Live monitor</h2>
      <MapView center={center} markers={markers} />
      <div className="card" style={{ marginTop: 16 }}>
        <strong>Active deliveries ({orders.length})</strong>
        {orders.map((o) => (
          <div key={o._id} className="row" style={{ padding: '6px 0', alignItems: 'center' }}>
            <span>{o.orderNumber}</span>
            <StatusBadge status={o.status} />
            <span className="muted">
              {o.currentLocation?.lat ? `${o.currentLocation.lat.toFixed(4)}, ${o.currentLocation.lng.toFixed(4)}` : 'Awaiting location'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
