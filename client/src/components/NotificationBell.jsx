import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

export default function NotificationBell() {
  const { user } = useAuth();
  const socket = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (user?.role === 'customer') {
      loadNotifications();
    }
  }, [user]);

  useEffect(() => {
    if (!socket || user?.role !== 'customer') return;
    
    // The user should be joined to a room `user:userId` on the backend when they connect.
    // Assuming backend emits 'notification:new'
    const handleNew = (notification) => {
      setNotifications(prev => [notification, ...prev]);
    };
    
    socket.on('notification:new', handleNew);
    return () => socket.off('notification:new', handleNew);
  }, [socket, user]);

  async function loadNotifications() {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.notifications);
    } catch (err) {
      console.error('Failed to load notifications', err);
    }
  }

  async function markAsRead(id) {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => 
        prev.map(n => n._id === id ? { ...n, read: true } : n)
      );
    } catch (err) {
      console.error('Failed to mark read', err);
    }
  }

  if (user?.role !== 'customer') return null;

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div style={{ position: 'relative', display: 'inline-block', marginRight: '20px' }}>
      <button 
        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', padding: '5px' }}
        onClick={() => setIsOpen(!isOpen)}
      >
        🔔
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: 0, right: 0,
            background: 'red', color: 'white', borderRadius: '50%',
            padding: '2px 6px', fontSize: '0.7rem'
          }}>
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute', top: '40px', right: 0,
          width: '300px', background: 'white', border: '1px solid #ccc',
          borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
          maxHeight: '400px', overflowY: 'auto', zIndex: 1000
        }}>
          <h4 style={{ margin: 0, padding: '12px', borderBottom: '1px solid #eee' }}>Notifications</h4>
          {notifications.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>No notifications</div>
          ) : (
            notifications.map(n => (
              <div 
                key={n._id} 
                onClick={() => { if (!n.read) markAsRead(n._id); }}
                style={{
                  padding: '12px', 
                  borderBottom: '1px solid #eee',
                  background: n.read ? '#fff' : '#f0f8ff',
                  cursor: n.read ? 'default' : 'pointer'
                }}
              >
                <div style={{ fontSize: '0.9rem' }}>{n.message}</div>
                <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '4px' }}>
                  {new Date(n.createdAt).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
