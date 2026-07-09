import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';

const containerStyle = { width: '100%', height: '360px', borderRadius: '10px' };

export default function MapView({ center, markers = [] }) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  });

  if (!import.meta.env.VITE_GOOGLE_MAPS_API_KEY) {
    return (
      <div className="card muted">
        Add VITE_GOOGLE_MAPS_API_KEY to client/.env to enable the live map.
      </div>
    );
  }

  if (!isLoaded) return <div className="card muted">Loading map…</div>;

  return (
    <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={12}>
      {markers.map((m) => (
        <Marker key={m.id} position={{ lat: m.lat, lng: m.lng }} label={m.label} title={m.title} />
      ))}
    </GoogleMap>
  );
}
