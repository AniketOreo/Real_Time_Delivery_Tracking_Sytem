import { useEffect, useRef, useState } from 'react';
import api from '../../api/axios';
import { useSocket } from '../../context/SocketContext';
import StatusBadge from '../../components/StatusBadge';

const AGENT_STATUSES = [
  'ready_to_ship',
  'picked up',
  'in_transit',
  'out_for_delivery',
  'delivered',
  'failed_attempt'
];

export default function AgentDashboard() {
  const socket = useSocket();
  const [activeOrders, setActiveOrders] = useState([]);
  const [historyOrders, setHistoryOrders] = useState([]);
  const [tab, setTab] = useState('active'); // 'active' | 'history'
  const [sharingId, setSharingId] = useState(null);
  const watchIdRef = useRef(null);

  // Modal states for Delivered / Failed
  const [showModal, setShowModal] = useState(null); // { type: 'delivered'|'failed', order: {} }
  const [otpInput, setOtpInput] = useState('');
  const [failureReason, setFailureReason] = useState('Customer Unavailable');
  const [modalError, setModalError] = useState('');

  const REASONS = ['Customer Unavailable', 'Address Incomplete', 'Refused by Customer', 'Other'];

  function loadOrders() {
    api.get('/orders/agent/mine').then((res) => setActiveOrders(res.data.orders));
    api.get('/orders/agent/history').then((res) => setHistoryOrders(res.data.orders));
  }

  useEffect(() => {
    loadOrders();
    return () => stopSharing();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function updateStatus(order, newStatus) {
    if (newStatus === 'delivered') {
      setShowModal({ type: 'delivered', order });
      setOtpInput('');
      setModalError('');
      return;
    }
    if (newStatus === 'failed_attempt') {
      setShowModal({ type: 'failed', order });
      setFailureReason('Customer Unavailable');
      setModalError('');
      return;
    }

    try {
      await api.patch(`/orders/${order._id}/status`, { status: newStatus });
      loadOrders();
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating status');
    }
  }

  async function submitModalAction() {
    try {
      if (showModal.type === 'delivered') {
        await api.patch(`/orders/${showModal.order._id}/status`, { 
          status: 'delivered', 
          providedOtp: otpInput 
        });
      } else {
        await api.patch(`/orders/${showModal.order._id}/status`, { 
          status: 'failed_attempt', 
          failureReason 
        });
      }
      setShowModal(null);
      loadOrders();
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to update order');
    }
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

  const renderOrderCard = (o, isActive) => (
    <div key={o._id} className="card" style={{ marginBottom: 16 }}>
      <div className="row" style={{ alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <strong style={{ fontSize: '1.2rem' }}>{o.orderNumber}</strong>
          <div className="muted" style={{ margin: '8px 0' }}>
            <div><strong>Pick:</strong> {o.pickupAddress}</div>
            <div><strong>Drop:</strong> {o.dropoffAddress}</div>
          </div>
          <div className="muted">
            Customer: {o.customer?.name} 
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <StatusBadge status={o.status} />
          {o.failureReason && <div style={{ color: 'red', marginTop: 4, fontSize: '0.8rem' }}>{o.failureReason}</div>}
        </div>
      </div>

      <div className="row" style={{ marginTop: 16, gap: '8px', flexWrap: 'wrap' }}>
        {o.customer?.phone && (
          <a href={`tel:${o.customer.phone}`} className="button" style={{ textDecoration: 'none' }}>📞 Call</a>
        )}
        {o.dropoffLocation && (
          <a 
            href={`https://www.google.com/maps/dir/?api=1&destination=${o.dropoffLocation.lat},${o.dropoffLocation.lng}`} 
            target="_blank" 
            rel="noreferrer" 
            className="button"
            style={{ textDecoration: 'none' }}
          >
            🗺️ Navigate
          </a>
        )}
        
        {isActive && (
          <>
            <select 
              value={o.status} 
              onChange={(e) => updateStatus(o, e.target.value)}
              style={{ padding: '6px' }}
            >
              <option value={o.status} disabled>Change Status...</option>
              {AGENT_STATUSES.map(s => (
                <option key={s} value={s}>{s.replace(/_/g, ' ').toUpperCase()}</option>
              ))}
            </select>

            {sharingId === o._id ? (
              <button className="danger" onClick={stopSharing}>Stop GPS</button>
            ) : (
              <button className="primary" onClick={() => startSharing(o._id)}>Share Live GPS</button>
            )}
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="container">
      <h2>Agent Dashboard</h2>
      
      <div className="row" style={{ marginBottom: 20 }}>
        <button className={tab === 'active' ? 'primary' : ''} onClick={() => setTab('active')}>
          Active ({activeOrders.length})
        </button>
        <button className={tab === 'history' ? 'primary' : ''} onClick={() => setTab('history')}>
          History ({historyOrders.length})
        </button>
      </div>

      {tab === 'active' && (
        <div>
          {activeOrders.length === 0 && <p className="muted">No active deliveries.</p>}
          {activeOrders.map(o => renderOrderCard(o, true))}
        </div>
      )}

      {tab === 'history' && (
        <div>
          {historyOrders.length === 0 && <p className="muted">No completed or failed deliveries yet.</p>}
          {historyOrders.map(o => renderOrderCard(o, false))}
        </div>
      )}

      {/* Modal for Delivery/Failure confirmation */}
      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999
        }}>
          <div className="card" style={{ width: 400, maxWidth: '90%' }}>
            <h3>{showModal.type === 'delivered' ? 'Verify Delivery' : 'Report Failure'}</h3>
            
            {showModal.type === 'delivered' ? (
              <div>
                <p>Please ask the customer for their 4-digit OTP to complete the delivery.</p>
                <input 
                  type="text" 
                  placeholder="Enter OTP" 
                  value={otpInput} 
                  onChange={e => setOtpInput(e.target.value)} 
                  style={{ width: '100%', padding: 8, marginTop: 8 }}
                />
              </div>
            ) : (
              <div>
                <p>Select the reason for the failed delivery attempt:</p>
                <select 
                  value={failureReason} 
                  onChange={e => setFailureReason(e.target.value)}
                  style={{ width: '100%', padding: 8, marginTop: 8 }}
                >
                  {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            )}

            {modalError && <p style={{ color: 'red', marginTop: 10 }}>{modalError}</p>}
            
            <div className="row" style={{ marginTop: 20, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowModal(null)} style={{ marginRight: 10 }}>Cancel</button>
              <button className="primary" onClick={submitModalAction}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
