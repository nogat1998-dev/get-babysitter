import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

export default function Dashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [error, setError] = useState('');

  const user = JSON.parse(localStorage.getItem('user') || 'null');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    api.getProfile()
      .then(data => setProfile(data.profile))
      .catch(err => setError(err.message));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  if (!user) return null;

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Welcome, {user.firstName}! 👋</h1>
        <button className="btn btn-secondary" onClick={handleLogout}>Logout</button>
      </div>

      <div style={{ padding: '1.5rem', background: '#f8fafc', borderRadius: '12px', marginBottom: '1rem' }}>
        <p><strong>Role:</strong> {user.role === 'parent' ? '👪 Parent' : '🧑‍🍼 Babysitter'}</p>
        <p><strong>Email:</strong> {user.email}</p>
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {profile && (
        <div style={{ padding: '1.5rem', background: '#f0fdf4', borderRadius: '12px' }}>
          <h3>Your Profile</h3>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.875rem' }}>
            {JSON.stringify(profile, null, 2)}
          </pre>
        </div>
      )}

      {user.role === 'parent' && (
        <div style={{ marginTop: '2rem', padding: '1.5rem', background: '#eff6ff', borderRadius: '12px' }}>
          <h3>🔍 Find Babysitters Near You</h3>
          <p style={{ color: '#64748b' }}>Location-based search will be available once you set your location in your profile.</p>
        </div>
      )}
    </div>
  );
}
