import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'parent' as 'parent' | 'babysitter',
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const data = await api.register(form);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h2 style={{ fontSize: '2rem', textAlign: 'center' }}>Create Account</h2>
        {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
        
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button type="button" className={`btn ${form.role === 'parent' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1 }} onClick={() => update('role', 'parent')}>
            👪 I'm a Parent
          </button>
          <button type="button" className={`btn ${form.role === 'babysitter' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1 }} onClick={() => update('role', 'babysitter')}>
            🧑‍🍼 I'm a Babysitter
          </button>
        </div>

        <input className="input" placeholder="First Name" value={form.firstName} onChange={e => update('firstName', e.target.value)} required />
        <input className="input" placeholder="Last Name" value={form.lastName} onChange={e => update('lastName', e.target.value)} required />
        <input className="input" type="email" placeholder="Email" value={form.email} onChange={e => update('email', e.target.value)} required />
        <input className="input" type="password" placeholder="Password (min 8 chars)" value={form.password} onChange={e => update('password', e.target.value)} required minLength={8} />
        
        <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Create Account</button>
        <p style={{ textAlign: 'center' }}>Already have an account? <Link to="/login">Sign In</Link></p>
      </form>
    </div>
  );
}
