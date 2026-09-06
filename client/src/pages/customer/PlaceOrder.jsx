import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import api from '../../api/axios';

import { nightModeStyle } from '../../utils/mapStyles';

const mapContainerStyle = { width: '100%', height: '400px', borderRadius: '16px' };
// Default center (e.g. some central location if no pins are set, let's use a generic one or India's center since they mentioned Delhivery)
const defaultCenter = { lat: 28.6139, lng: 77.2090 }; 

const glassmorphicStyle = {
  padding: '8px',
  background: 'rgba(255, 255, 255, 0.1)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  borderRadius: '24px',
  boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
  overflow: 'hidden'
};

export default function PlaceOrder() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    pickupAddress: '', dropoffAddress: '',
    pickupLat: '', pickupLng: '', dropoffLat: '', dropoffLng: '', notes: ''
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [activePin, setActivePin] = useState('pickup'); // 'pickup' | 'dropoff'

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  });

  const handleAddressBlur = (type) => {
    if (!window.google) return;
    const geocoder = new window.google.maps.Geocoder();
    const address = type === 'pickup' ? form.pickupAddress : form.dropoffAddress;
    if (!address) return;

    geocoder.geocode({ address }, (results, status) => {
      if (status === 'OK' && results[0]) {
        const lat = results[0].geometry.location.lat();
        const lng = results[0].geometry.location.lng();
        if (type === 'pickup') {
          setForm(prev => ({ ...prev, pickupLat: lat.toFixed(6), pickupLng: lng.toFixed(6) }));
        } else {
          setForm(prev => ({ ...prev, dropoffLat: lat.toFixed(6), dropoffLng: lng.toFixed(6) }));
        }
      }
    });
  };

  const handleMapClick = useCallback((e) => {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    if (activePin === 'pickup') {
      setForm(prev => ({ ...prev, pickupLat: lat.toFixed(6), pickupLng: lng.toFixed(6) }));
    } else {
      setForm(prev => ({ ...prev, dropoffLat: lat.toFixed(6), dropoffLng: lng.toFixed(6) }));
    }
  }, [activePin]);

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

  const pLat = parseFloat(form.pickupLat);
  const pLng = parseFloat(form.pickupLng);
  const dLat = parseFloat(form.dropoffLat);
  const dLng = parseFloat(form.dropoffLng);

  const hasPickup = !isNaN(pLat) && !isNaN(pLng);
  const hasDropoff = !isNaN(dLat) && !isNaN(dLng);

  const currentCenter = hasPickup ? { lat: pLat, lng: pLng } : defaultCenter;

  return (
    <div className="container" style={{ maxWidth: 800 }}>
      <h2>Place an order</h2>
      <p className="muted">
        Enter the address manually, or click on the map below to pinpoint the exact coordinates.
      </p>

      <div className="row" style={{ alignItems: 'flex-start', gap: '24px' }}>
        
        {/* Left Side: Map */}
        <div style={{ flex: 1, minWidth: '300px' }}>
          <div className="row" style={{ gap: '10px' }}>
            <button 
              type="button"
              className={activePin === 'pickup' ? 'primary' : ''} 
              onClick={() => setActivePin('pickup')}
            >
              📍 Set Pickup Pin
            </button>
            <button 
              type="button"
              className={activePin === 'dropoff' ? 'primary' : ''} 
              onClick={() => setActivePin('dropoff')}
            >
              🎯 Set Dropoff Pin
            </button>
          </div>

          {!import.meta.env.VITE_GOOGLE_MAPS_API_KEY ? (
            <div className="card muted" style={{ marginTop: 16 }}>
              Add VITE_GOOGLE_MAPS_API_KEY to client/.env to enable the map picker.
            </div>
          ) : !isLoaded ? (
            <div className="card muted" style={{ marginTop: 16 }}>Loading map…</div>
          ) : (
            <div style={{ ...glassmorphicStyle, marginTop: '16px', marginBottom: '16px' }}>
              <GoogleMap 
                mapContainerStyle={mapContainerStyle} 
                center={currentCenter} 
                zoom={10}
                onClick={handleMapClick}
                options={{ styles: nightModeStyle, disableDefaultUI: true, zoomControl: true }}
              >
                {hasPickup && <Marker position={{ lat: pLat, lng: pLng }} label="P" title="Pickup" />}
                {hasDropoff && <Marker position={{ lat: dLat, lng: dLng }} label="D" title="Dropoff" />}
              </GoogleMap>
            </div>
          )}
        </div>

        {/* Right Side: Form */}
        <form onSubmit={handleSubmit} className="card" style={{ flex: 1, minWidth: '300px' }}>
          
          <div style={{ marginBottom: 20, padding: 10, borderLeft: '4px solid #4CAF50', backgroundColor: '#f9f9f9' }}>
            <div className="form-group">
              <label htmlFor="pickupAddress">Pickup Address</label>
              <input id="pickupAddress" required value={form.pickupAddress}
                onChange={(e) => setForm({ ...form, pickupAddress: e.target.value })}
                onBlur={() => handleAddressBlur('pickup')}
                placeholder="Type address, map will update"
              />
            </div>
            <div className="row form-group" style={{ gap: 10 }}>
              <div style={{ flex: 1 }}>
                <label htmlFor="pickupLat">Lat</label>
                <input id="pickupLat" type="number" step="any" required value={form.pickupLat}
                  onChange={(e) => setForm({ ...form, pickupLat: e.target.value })} />
              </div>
              <div style={{ flex: 1 }}>
                <label htmlFor="pickupLng">Lng</label>
                <input id="pickupLng" type="number" step="any" required value={form.pickupLng}
                  onChange={(e) => setForm({ ...form, pickupLng: e.target.value })} />
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 20, padding: 10, borderLeft: '4px solid #f44336', backgroundColor: '#f9f9f9' }}>
            <div className="form-group">
              <label htmlFor="dropoffAddress">Dropoff Address</label>
              <input id="dropoffAddress" required value={form.dropoffAddress}
                onChange={(e) => setForm({ ...form, dropoffAddress: e.target.value })}
                onBlur={() => handleAddressBlur('dropoff')}
                placeholder="Type address, map will update"
              />
            </div>
            <div className="row form-group" style={{ gap: 10 }}>
              <div style={{ flex: 1 }}>
                <label htmlFor="dropoffLat">Lat</label>
                <input id="dropoffLat" type="number" step="any" required value={form.dropoffLat}
                  onChange={(e) => setForm({ ...form, dropoffLat: e.target.value })} />
              </div>
              <div style={{ flex: 1 }}>
                <label htmlFor="dropoffLng">Lng</label>
                <input id="dropoffLng" type="number" step="any" required value={form.dropoffLng}
                  onChange={(e) => setForm({ ...form, dropoffLng: e.target.value })} />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="notes">Notes (optional)</label>
            <textarea id="notes" rows={2} value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          {error && <div className="error-text">{error}</div>}
          <button type="submit" className="primary" disabled={submitting} style={{ width: '100%', marginTop: 10 }}>
            {submitting ? 'Placing order…' : 'Place order'}
          </button>
        </form>
      </div>
    </div>
  );
}
