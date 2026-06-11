import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '1rem', color: '#6366f1' }}>🍼 Get Babysitter</h1>
      <p style={{ fontSize: '1.25rem', marginBottom: '2rem', color: '#64748b', textAlign: 'center', maxWidth: '600px' }}>
        Find trusted babysitters near you, or offer your babysitting services to families in your area.
      </p>
      <div style={{ display: 'flex', gap: '1rem' }}>
        <Link to="/login">
          <button className="btn btn-secondary">Sign In</button>
        </Link>
        <Link to="/register">
          <button className="btn btn-primary">Get Started</button>
        </Link>
      </div>
    </div>
  );
}
