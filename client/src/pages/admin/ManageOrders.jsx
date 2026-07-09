import { useEffect, useState } from 'react';
import api from '../../api/axios';
import StatusBadge from '../../components/StatusBadge';

export default function ManageOrders() {
  const [orders, setOrders] = useState([]);
  const [agents, setAgents] = useState([]);

  function load() {
    api.get('/orders').then((res) => setOrders(res.data.orders));
    api.get('/users/agents').then((res) => setAgents(res.data.agents));
  }

  useEffect(load, []);

  async function assign(orderId, agentId) {
    if (!agentId) return;
    await api.patch(`/orders/${orderId}/assign`, { agentId });
    load();
  }

  return (
    <div className="container">
      <h2>Manage orders</h2>
      <table className="card">
        <thead>
          <tr>
            <th>Order</th>
            <th>Customer</th>
            <th>Route</th>
            <th>Status</th>
            <th>Agent</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o._id}>
              <td>{o.orderNumber}</td>
              <td>{o.customer?.name}</td>
              <td>{o.pickupAddress} → {o.dropoffAddress}</td>
              <td><StatusBadge status={o.status} /></td>
              <td>
                <select
                  value={o.assignedAgent?._id || ''}
                  onChange={(e) => assign(o._id, e.target.value)}
                >
                  <option value="">Unassigned</option>
                  {agents.map((a) => (
                    <option key={a._id} value={a._id}>{a.name}</option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
