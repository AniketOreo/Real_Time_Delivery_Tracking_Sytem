import { useState, useEffect } from 'react';
import { GoogleMap, Marker, DirectionsRenderer, useJsApiLoader } from '@react-google-maps/api';

import { nightModeStyle } from '../utils/mapStyles';

const containerStyle = { width: '100%', height: '360px', borderRadius: '16px' };
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

export default function MapView({ center, markers = [] }) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  });
  
  const [directions, setDirections] = useState(null);

  useEffect(() => {
    if (!isLoaded || !window.google) return;
    
    const agent = markers.find(m => m.id === 'agent');
    const dropoff = markers.find(m => m.id === 'dropoff');
    
    if (agent && dropoff) {
      // Calculate straight-line distance in meters using Haversine
      const R = 6371e3; // metres
      const φ1 = agent.lat * Math.PI/180;
      const φ2 = dropoff.lat * Math.PI/180;
      const Δφ = (dropoff.lat-agent.lat) * Math.PI/180;
      const Δλ = (dropoff.lng-agent.lng) * Math.PI/180;

      const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ/2) * Math.sin(Δλ/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c;

      // Only show blue path if within 5000 meters (5km) - typical city range
      if (distance <= 5000) {
        const directionsService = new window.google.maps.DirectionsService();
        directionsService.route(
          {
            origin: new window.google.maps.LatLng(agent.lat, agent.lng),
            destination: new window.google.maps.LatLng(dropoff.lat, dropoff.lng),
            travelMode: window.google.maps.TravelMode.DRIVING,
          },
          (result, status) => {
            if (status === window.google.maps.DirectionsStatus.OK) {
              setDirections(result);
            }
          }
        );
      } else {
        setDirections(null);
      }
    } else {
      setDirections(null);
    }
  }, [isLoaded, markers]);

  if (!import.meta.env.VITE_GOOGLE_MAPS_API_KEY) {
    return (
      <div className="card muted">
        Add VITE_GOOGLE_MAPS_API_KEY to client/.env to enable the live map.
      </div>
    );
  }

  if (!isLoaded) return <div className="card muted">Loading map…</div>;

  return (
    <div style={glassmorphicStyle}>
      <GoogleMap 
        mapContainerStyle={containerStyle} 
        center={center} 
        zoom={12}
        options={{ styles: nightModeStyle, disableDefaultUI: true, zoomControl: true }}
      >
        {markers.map((m) => (
          <Marker key={m.id} position={{ lat: m.lat, lng: m.lng }} label={m.label} title={m.title} />
        ))}
        {directions && (
          <DirectionsRenderer 
            directions={directions} 
            options={{
              suppressMarkers: true,
              polylineOptions: { strokeColor: '#007bff', strokeWeight: 5, strokeOpacity: 0.8 }
            }} 
          />
        )}
      </GoogleMap>
    </div>
  );
}
