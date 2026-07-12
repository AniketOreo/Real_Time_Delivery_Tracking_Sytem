import { useEffect, useState } from 'react';
import api from '../../api/axios';
import StatusBadge from '../../components/StatusBadge';

function formatDuration(minutes) {
  if (minutes === null || minutes === undefined) return '—';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

export default function Reports() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/users/reports/summary').then((res) => setData(res.data));
  }, []);

  if (!data) return <div className="container muted">Loading…</div>;

  return (
    <div className="container">
      <h2>Performance reports</h2>

      <div className="row">
        <div className="card">
          <div className="muted">Total orders</div>
          <div style={{ fontSize: 24, fontWeight: 500 }}>{data.totalOrders}</div>
        </div>
        <div className="card">
          <div className="muted">On-time delivery rate</div>
          <div style={{ fontSize: 24, fontWeight: 500 }}>{data.onTimeRate === null ? '—' : `${data.onTimeRate}%`}</div>
        </div>
        <div className="card">
          <div className="muted">Active deliveries</div>
          <div style={{ fontSize: 24, fontWeight: 500 }}>{data.activeDeliveries}</div>
        </div>
        <div className="card">
          <div className="muted">Average delivery duration</div>
          <div style={{ fontSize: 24, fontWeight: 500 }}>{formatDuration(data.avgDeliveryDurationMinutes)}</div>
        </div>
      </div>

      <div className="card">
        <strong>Orders by status</strong>
        {data.statusCounts.map((s) => (
          <div key={s._id} className="row" style={{ padding: '4px 0', alignItems: 'center' }}>
            <StatusBadge status={s._id} />
            <span>{s.count}</span>
          </div>
        ))}
      </div>

      <div className="card">
        <strong>Deliveries per agent</strong>
        <table>
          <thead><tr><th>Agent</th><th>Total assigned</th><th>Delivered</th></tr></thead>
          <tbody>
            {data.perAgent.map((a) => (
              <tr key={a.agentId}><td>{a.name}</td><td>{a.total}</td><td>{a.delivered}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
