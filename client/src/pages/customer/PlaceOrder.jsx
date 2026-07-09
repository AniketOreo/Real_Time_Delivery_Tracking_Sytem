import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

export default function PlaceOrder() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    pickupAddress: '', dropoffAddress: '',
    pickupLat: '', pickupLng: '', dropoffLat: '', dropoffLng: '', notes: ''
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await api.post('/orders', {
        pickupAddress: form.pickupAddress,
        dropoffAddress: form.dropoffAddress,
        pickupLocation: { lat: parseFloat(form.pickupLat), lng: parseFloat(form.pickupLng) },
        dropoffLocation: { lat: parseFloat(form.dropoffLat), lng: parseFloat(form.dropoffLng) },
        notes: form.notes
      });
      navigate(`/customer/track/${res.data.order._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not place the order.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container" style={{ maxWidth: 560 }}>
      <h2>Place an order</h2>
      <p className="muted">
        Coordinates are entered manually in this scaffold. In production, swap
        these two fields for the Google Places Autocomplete widget, which
        returns lat/lng for you.
      </p>
      <form onSubmit={handleSubmit} className="card">
        <div className="form-group">
          <label htmlFor="pickupAddress">Pickup address</label>
          <input id="pickupAddress" required value={form.pickupAddress}
            onChange={(e) => setForm({ ...form, pickupAddress: e.target.value })} />
        </div>
        <div className="row form-group">
          <div>
            <label htmlFor="pickupLat">Pickup latitude</label>
            <input id="pickupLat" type="number" step="any" required value={form.pickupLat}
              onChange={(e) => setForm({ ...form, pickupLat: e.target.value })} />
          </div>
          <div>
            <label htmlFor="pickupLng">Pickup longitude</label>
            <input id="pickupLng" type="number" step="any" required value={form.pickupLng}
              onChange={(e) => setForm({ ...form, pickupLng: e.target.value })} />
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="dropoffAddress">Dropoff address</label>
          <input id="dropoffAddress" required value={form.dropoffAddress}
            onChange={(e) => setForm({ ...form, dropoffAddress: e.target.value })} />
        </div>
        <div className="row form-group">
          <div>
            <label htmlFor="dropoffLat">Dropoff latitude</label>
            <input id="dropoffLat" type="number" step="any" required value={form.dropoffLat}
              onChange={(e) => setForm({ ...form, dropoffLat: e.target.value })} />
          </div>
          <div>
            <label htmlFor="dropoffLng">Dropoff longitude</label>
            <input id="dropoffLng" type="number" step="any" required value={form.dropoffLng}
              onChange={(e) => setForm({ ...form, dropoffLng: e.target.value })} />
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="notes">Notes (optional)</label>
          <textarea id="notes" rows={3} value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </div>
        {error && <div className="error-text">{error}</div>}
        <button type="submit" className="primary" disabled={submitting}>
          {submitting ? 'Placing order…' : 'Place order'}
        </button>
      </form>
    </div>
  );
}
