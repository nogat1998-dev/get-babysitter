import { useEffect, useState } from 'react';
import { api } from '../services/api';

interface Babysitter {
  id: string;
  first_name: string;
  last_name: string;
  city: string;
  avatar_url: string | null;
  hourly_rate: number;
  experience_years: number;
  bio: string;
  rating: number;
  total_reviews: number;
  available_days: string;
  distance_km?: number;
}

export default function FindBabysitters() {
  const [babysitters, setBabysitters] = useState<Babysitter[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [radius, setRadius] = useState(10);
  const [selectedBabysitter, setSelectedBabysitter] = useState<Babysitter | null>(null);

  const [addressQuery, setAddressQuery] = useState('');
  const [geocoding, setGeocoding] = useState(false);

  useEffect(() => {
    // Try to get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => {
          // Default to Tel Aviv if denied
          setLocation({ lat: 32.0853, lng: 34.7818 });
        }
      );
    }
  }, []);

  useEffect(() => {
    if (location) {
      searchBabysitters();
    }
  }, [location, radius]);

  const geocodeAddress = async () => {
    if (!addressQuery.trim()) return;
    setGeocoding(true);
    setError('');
    try {
      const encoded = encodeURIComponent(addressQuery.trim());
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=1`);
      const results = await res.json();
      if (results.length > 0) {
        setLocation({ lat: parseFloat(results[0].lat), lng: parseFloat(results[0].lon) });
      } else {
        setError('Address not found. Try a different city or address.');
      }
    } catch {
      setError('Failed to look up address. Please try again.');
    } finally {
      setGeocoding(false);
    }
  };

  const handleAddressKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      geocodeAddress();
    }
  };

  const searchBabysitters = async () => {
    if (!location) return;
    setLoading(true);
    setError('');
    try {
      const data = await api.getNearbyBabysitters(location.lat, location.lng, radius);
      setBabysitters(data.babysitters || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ marginBottom: '1rem' }}>🔍 Find Babysitters Near You</h2>

        {/* Address search */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <input className="input" style={{ flex: 1 }}
            placeholder="Enter city or address (e.g., Tel Aviv, Herzliya...)"
            value={addressQuery}
            onChange={e => setAddressQuery(e.target.value)}
            onKeyDown={handleAddressKeyDown}
          />
          <button className="btn btn-primary" onClick={geocodeAddress} disabled={geocoding || !addressQuery.trim()}>
            {geocoding ? '...' : '📍 Search'}
          </button>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            Radius:
            <select className="input" style={{ width: 'auto' }} value={radius} onChange={e => setRadius(Number(e.target.value))}>
              <option value={3}>3 km</option>
              <option value={5}>5 km</option>
              <option value={10}>10 km</option>
              <option value={20}>20 km</option>
              <option value={50}>50 km</option>
            </select>
          </label>
          <button className="btn btn-secondary" onClick={searchBabysitters} disabled={loading}>
            {loading ? 'Searching...' : '🔄 Refresh'}
          </button>
          {location && (
            <span style={{ fontSize: '0.875rem', color: '#64748b' }}>
              📍 {location.lat.toFixed(3)}, {location.lng.toFixed(3)}
            </span>
          )}
        </div>
      </div>

      {error && <p style={{ color: '#ef4444' }}>{error}</p>}

      {babysitters.length === 0 && !loading && (
        <div style={{ padding: '3rem', textAlign: 'center', background: '#f8fafc', borderRadius: '12px' }}>
          <p style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>No babysitters found nearby</p>
          <p style={{ color: '#64748b' }}>Try increasing the search radius or check back later.</p>
        </div>
      )}

      <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
        {babysitters.map(b => (
          <div key={b.id} onClick={() => setSelectedBabysitter(b)}
            style={{ padding: '1.5rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', cursor: 'pointer', transition: 'box-shadow 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)')}
            onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '1.1rem', overflow: 'hidden' }}>
                {b.avatar_url ? <img src={b.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : `${b.first_name?.[0]}${b.last_name?.[0]}`}
              </div>
              <div>
                <h4 style={{ margin: 0 }}>{b.first_name} {b.last_name}</h4>
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>{b.city || 'Location not set'}</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
              {b.hourly_rate && <span>💰 ${b.hourly_rate}/hr</span>}
              {b.experience_years > 0 && <span>📅 {b.experience_years} yrs exp</span>}
              {b.rating > 0 && <span>⭐ {b.rating}</span>}
            </div>
            {b.distance_km !== undefined && (
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0 }}>📍 {b.distance_km.toFixed(1)} km away</p>
            )}
            {b.bio && <p style={{ fontSize: '0.875rem', color: '#475569', marginTop: '0.5rem', lineHeight: 1.4 }}>{b.bio.substring(0, 100)}{b.bio.length > 100 ? '...' : ''}</p>}
          </div>
        ))}
      </div>

      {/* Detail modal */}
      {selectedBabysitter && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', zIndex: 1000 }}
          onClick={() => setSelectedBabysitter(null)}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '2rem', maxWidth: '500px', width: '100%', maxHeight: '80vh', overflow: 'auto' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '1.4rem', overflow: 'hidden' }}>
                  {selectedBabysitter.avatar_url ? <img src={selectedBabysitter.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : `${selectedBabysitter.first_name?.[0]}${selectedBabysitter.last_name?.[0]}`}
                </div>
                <div>
                  <h2 style={{ margin: 0 }}>{selectedBabysitter.first_name} {selectedBabysitter.last_name}</h2>
                  <p style={{ margin: 0, color: '#64748b' }}>{selectedBabysitter.city}</p>
                </div>
              </div>
              <button onClick={() => setSelectedBabysitter(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <InfoBox label="Hourly Rate" value={selectedBabysitter.hourly_rate ? `$${selectedBabysitter.hourly_rate}` : 'Not set'} />
              <InfoBox label="Experience" value={selectedBabysitter.experience_years ? `${selectedBabysitter.experience_years} years` : 'Not set'} />
              <InfoBox label="Rating" value={selectedBabysitter.rating ? `⭐ ${selectedBabysitter.rating} (${selectedBabysitter.total_reviews} reviews)` : 'No reviews yet'} />
              <InfoBox label="Distance" value={selectedBabysitter.distance_km !== undefined ? `${selectedBabysitter.distance_km.toFixed(1)} km` : 'Unknown'} />
            </div>

            {selectedBabysitter.bio && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ marginBottom: '0.5rem' }}>About</h4>
                <p style={{ color: '#475569', lineHeight: 1.6 }}>{selectedBabysitter.bio}</p>
              </div>
            )}

            {selectedBabysitter.available_days && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ marginBottom: '0.5rem' }}>Available Days</h4>
                <p style={{ color: '#475569' }}>{selectedBabysitter.available_days}</p>
              </div>
            )}

            <button className="btn btn-primary" style={{ width: '100%' }}>📩 Contact {selectedBabysitter.first_name}</button>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: '8px' }}>
      <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>{label}</p>
      <p style={{ fontWeight: 600, margin: 0 }}>{value}</p>
    </div>
  );
}
