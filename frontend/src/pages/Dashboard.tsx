import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import FindBabysitters from './FindBabysitters';
import BabysitterDashboard from './BabysitterDashboard';

type Tab = 'home' | 'profile' | 'search';

export default function Dashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<any>({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tab, setTab] = useState<Tab>('home');

  const user = JSON.parse(localStorage.getItem('user') || 'null');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadProfile();
  }, []);

  const loadProfile = () => {
    api.getProfile()
      .then(data => {
        setProfile(data.profile);
        setForm(data.profile);
      })
      .catch(err => setError(err.message));
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const handleSave = async () => {
    setError('');
    setSuccess('');
    try {
      const updates: any = {
        firstName: form.first_name,
        lastName: form.last_name,
        phone: form.phone,
        city: form.city,
        address: form.address,
      };

      if (user.role === 'parent') {
        updates.numberOfChildren = form.number_of_children;
        updates.childrenAges = form.children_ages;
        updates.specialNeeds = form.special_needs;
        updates.bio = form.bio;
      } else {
        updates.hourlyRate = form.hourly_rate;
        updates.experienceYears = form.experience_years;
        updates.bio = form.bio;
        updates.availableDays = form.available_days;
      }

      await api.updateProfile(updates);
      setSuccess('Profile saved!');
      setEditing(false);
      loadProfile();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const update = (field: string, value: any) => setForm((prev: any) => ({ ...prev, [field]: value }));

  if (!user) return null;

  const tabs = user.role === 'parent'
    ? [
        { id: 'home' as Tab, label: '🏠 Home' },
        { id: 'search' as Tab, label: '🔍 Find Babysitters' },
        { id: 'profile' as Tab, label: '👤 My Profile' },
      ]
    : [
        { id: 'home' as Tab, label: '🏠 Dashboard' },
        { id: 'profile' as Tab, label: '👤 My Profile' },
      ];

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      {/* Header */}
      <header style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '1.25rem', color: '#6366f1', margin: 0 }}>🍼 Get Babysitter</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '0.875rem', color: '#64748b' }}>
            {user.firstName} ({user.role === 'parent' ? '👪 Parent' : '🧑‍🍼 Babysitter'})
          </span>
          <button className="btn btn-secondary" onClick={handleLogout} style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>Logout</button>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '0 2rem', display: 'flex', gap: '0' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ padding: '1rem 1.5rem', border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.9rem', fontWeight: tab === t.id ? 600 : 400, color: tab === t.id ? '#6366f1' : '#64748b', borderBottom: tab === t.id ? '2px solid #6366f1' : '2px solid transparent', transition: 'all 0.2s' }}>
            {t.label}
          </button>
        ))}
      </nav>

      {/* Content */}
      <main style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
        {error && <p style={{ color: '#ef4444', marginBottom: '1rem' }}>{error}</p>}
        {success && <p style={{ color: '#22c55e', marginBottom: '1rem' }}>{success}</p>}

        {/* Home tab */}
        {tab === 'home' && user.role === 'parent' && (
          <div>
            <h2 style={{ marginBottom: '1rem' }}>Welcome back, {user.firstName}! 👋</h2>
            <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', marginBottom: '2rem' }}>
              <ActionCard icon="🔍" title="Find Babysitters" description="Search for available babysitters near your location" onClick={() => setTab('search')} />
              <ActionCard icon="👤" title="Edit Profile" description="Update your family info and location" onClick={() => setTab('profile')} />
              <ActionCard icon="📍" title="Set Location" description="Enable location for better search results" onClick={() => setTab('profile')} />
            </div>
          </div>
        )}

        {tab === 'home' && user.role === 'babysitter' && (
          <BabysitterDashboard />
        )}

        {/* Search tab (parents only) */}
        {tab === 'search' && user.role === 'parent' && (
          <FindBabysitters />
        )}

        {/* Profile tab */}
        {tab === 'profile' && profile && (
          <div style={{ background: '#fff', padding: '2rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2>Your Profile</h2>
              {!editing ? (
                <button className="btn btn-primary" onClick={() => setEditing(true)}>Edit</button>
              ) : (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn btn-primary" onClick={handleSave}>Save</button>
                  <button className="btn btn-secondary" onClick={() => { setEditing(false); setForm(profile); }}>Cancel</button>
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gap: '1rem' }}>
              <ProfileField label="First Name" value={form.first_name} editing={editing} onChange={v => update('first_name', v)} />
              <ProfileField label="Last Name" value={form.last_name} editing={editing} onChange={v => update('last_name', v)} />
              <ProfileField label="Phone" value={form.phone} editing={editing} onChange={v => update('phone', v)} />
              <ProfileField label="City" value={form.city} editing={editing} onChange={v => update('city', v)} />
              <ProfileField label="Address" value={form.address} editing={editing} onChange={v => update('address', v)} />

              {user.role === 'parent' && (
                <>
                  <ProfileField label="Number of Children" value={form.number_of_children} editing={editing} type="number" onChange={v => update('number_of_children', parseInt(v) || 0)} />
                  <ProfileField label="Children Ages" value={form.children_ages} editing={editing} onChange={v => update('children_ages', v)} placeholder="e.g., 3, 5, 8" />
                  <ProfileField label="Special Needs" value={form.special_needs} editing={editing} onChange={v => update('special_needs', v)} multiline />
                  <ProfileField label="Bio" value={form.bio} editing={editing} onChange={v => update('bio', v)} multiline />
                </>
              )}

              {user.role === 'babysitter' && (
                <>
                  <ProfileField label="Hourly Rate ($)" value={form.hourly_rate} editing={editing} type="number" onChange={v => update('hourly_rate', parseFloat(v) || 0)} />
                  <ProfileField label="Years of Experience" value={form.experience_years} editing={editing} type="number" onChange={v => update('experience_years', parseInt(v) || 0)} />
                  <ProfileField label="Available Days" value={form.available_days} editing={editing} onChange={v => update('available_days', v)} placeholder="e.g., Monday, Wednesday, Friday" />
                  <ProfileField label="Bio" value={form.bio} editing={editing} onChange={v => update('bio', v)} multiline placeholder="Tell parents about yourself, your experience with kids..." />
                </>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function ActionCard({ icon, title, description, onClick }: { icon: string; title: string; description: string; onClick: () => void }) {
  return (
    <div onClick={onClick} style={{ padding: '1.5rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', cursor: 'pointer', transition: 'box-shadow 0.2s' }}
      onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)')}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}>
      <span style={{ fontSize: '2rem' }}>{icon}</span>
      <h3 style={{ margin: '0.5rem 0 0.25rem' }}>{title}</h3>
      <p style={{ color: '#64748b', fontSize: '0.875rem', margin: 0 }}>{description}</p>
    </div>
  );
}

function ProfileField({ label, value, editing, onChange, type = 'text', multiline = false, placeholder = '' }: {
  label: string;
  value: any;
  editing: boolean;
  onChange: (v: string) => void;
  type?: string;
  multiline?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label style={{ fontWeight: 600, fontSize: '0.875rem', color: '#374151', display: 'block', marginBottom: '0.25rem' }}>{label}</label>
      {editing ? (
        multiline ? (
          <textarea className="input" value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={3} style={{ resize: 'vertical' }} />
        ) : (
          <input className="input" type={type} value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
        )
      ) : (
        <p style={{ padding: '0.5rem 0', color: value ? '#1f2937' : '#9ca3af' }}>{value || '—'}</p>
      )}
    </div>
  );
}
