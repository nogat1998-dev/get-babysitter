import { pool, query } from './pool';

const migrations = `
-- Enable PostGIS extension for geospatial queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- Users table (shared between parents and babysitters)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('parent', 'babysitter')),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  avatar_url TEXT,
  location GEOGRAPHY(POINT, 4326),
  address TEXT,
  city VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Parent profiles
CREATE TABLE IF NOT EXISTS parent_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  number_of_children INTEGER DEFAULT 0,
  children_ages TEXT,
  special_needs TEXT,
  bio TEXT
);

-- Babysitter profiles
CREATE TABLE IF NOT EXISTS babysitter_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  hourly_rate DECIMAL(10, 2),
  experience_years INTEGER DEFAULT 0,
  bio TEXT,
  certifications TEXT[],
  available_days TEXT[],
  max_distance_km DECIMAL(5, 2) DEFAULT 10.0,
  rating DECIMAL(3, 2) DEFAULT 0.00,
  total_reviews INTEGER DEFAULT 0
);

-- Spatial index for fast location queries
CREATE INDEX IF NOT EXISTS idx_users_location ON users USING GIST (location);

-- Index for role-based queries
CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);
`;

async function migrate() {
  console.log('Running database migrations...');
  try {
    await query(migrations);
    console.log('Migrations completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
