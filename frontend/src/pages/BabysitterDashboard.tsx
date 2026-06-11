import { useEffect, useState } from 'react';
import { api } from '../services/api';

export default function BabysitterDashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getProfile()
      .then(data => setProfile(data.profile))
      .catch(err => setError(err.message));
  }, []);

  if (!profile) return <p>Loading...</p>;

  const completionItems = [
    { label: 'Bio', done: !!profile.bio },
    { label: 'Hourly rate', done: !!profile.hourly_rate },
    { label: 'Experience', done: !!profile.experience_years },
    { label: 'City', done: !!profile.city },
    { label: 'Available days', done: !!profile.available_days },
  ];
  const completedCount = completionItems.filter(i => i.done).length;
  const completionPct = Math.round((completedCount / completionItems.length) * 100);

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem' }}>🧑‍🍼 Your Babysitter Dashboard</h2>

      {error && <p style={{ color: '#ef4444' }}>{error}</p>}

      {/* Profile completeness */}
      <div style={{ padding: '1.5rem', background: '#f0fdf4', borderRadius: '12px', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <h3>Profile Completeness</h3>
          <span style={{ fontWeight: 700, color: completionPct === 100 ? '#22c55e' : '#f59e0b' }}>{completionPct}%</span>
        </div>
        <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden', marginBottom: '1rem' }}>
          <div style={{ height: '100%', width: `${completionPct}%`, background: completionPct === 100 ? '#22c55e' : '#6366f1', borderRadius: '4px', transition: 'width 0.3s' }} />
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {completionItems.map(item => (
            <span key={item.label} style={{ padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.8rem', background: item.done ? '#dcfce7' : '#fef3c7', color: item.done ? '#166534' : '#92400e' }}>
              {item.done ? '✓' : '○'} {item.label}
            </span>
          ))}
        </div>
      </div>

      {/* Public preview */}
      <div style={{ padding: '1.5rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>👁️ How parents see you</h3>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '1.4rem', overflow: 'hidden' }}>
            {profile.avatar_url ? <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : `${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}`}
          </div>
          <div>
            <h4 style={{ margin: 0 }}>{profile.first_name} {profile.last_name}</h4>
            <p style={{ margin: 0, color: '#64748b' }}>{profile.city || 'City not set'}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', marginBottom: '1rem' }}>
          <span>💰 {profile.hourly_rate ? `$${profile.hourly_rate}/hr` : 'Rate not set'}</span>
          <span>📅 {profile.experience_years ? `${profile.experience_years} yrs` : 'Experience not set'}</span>
          <span>⭐ {profile.rating || 'No ratings'}</span>
        </div>
        {profile.bio ? (
          <p style={{ color: '#475569', lineHeight: 1.5 }}>{profile.bio}</p>
        ) : (
          <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>Add a bio to tell parents about yourself...</p>
        )}
      </div>

      {/* Tips */}
      <div style={{ padding: '1.5rem', background: '#eff6ff', borderRadius: '12px' }}>
        <h3 style={{ marginBottom: '0.75rem' }}>💡 Tips to get more bookings</h3>
        <ul style={{ paddingLeft: '1.25rem', color: '#475569', lineHeight: 2 }}>
          <li>Complete your profile — parents prefer babysitters with full profiles</li>
          <li>Set a competitive hourly rate for your area</li>
          <li>Write a bio that mentions specific experience (ages, special needs, activities)</li>
          <li>Keep your available days up to date</li>
          <li>Set your location so nearby parents can find you</li>
        </ul>
      </div>
    </div>
  );
}
