import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(__dirname, '..', '..', 'dev.db');
const db = new Database(dbPath);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('parent', 'babysitter')),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    latitude REAL,
    longitude REAL,
    address TEXT,
    city TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS parent_profiles (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    number_of_children INTEGER DEFAULT 0,
    children_ages TEXT,
    special_needs TEXT,
    bio TEXT
  );

  CREATE TABLE IF NOT EXISTS babysitter_profiles (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    hourly_rate REAL,
    experience_years INTEGER DEFAULT 0,
    bio TEXT,
    certifications TEXT,
    available_days TEXT,
    max_distance_km REAL DEFAULT 10.0,
    rating REAL DEFAULT 0.00,
    total_reviews INTEGER DEFAULT 0
  );
`);

// Adapter: make SQLite look like pg's query interface
export async function query(text: string, params?: any[]) {
  // Convert PostgreSQL-style $1, $2 to SQLite ? placeholders
  let sqliteText = text;
  let sqliteParams = params || [];

  // Replace $N parameters with ?
  sqliteText = sqliteText.replace(/\$(\d+)/g, '?');

  // Replace PostgreSQL-specific syntax for dev mode
  sqliteText = sqliteText.replace(/::geography|::text\[\]/g, '');
  sqliteText = sqliteText.replace(/RETURNING .*/gi, '');
  sqliteText = sqliteText.replace(/\bNOW\(\)/gi, "datetime('now')");
  sqliteText = sqliteText.replace(/ST_SetSRID\(ST_MakePoint\([^)]+\),\s*\d+\)/g, 'NULL');
  
  // Handle PostGIS functions — simplified distance calculation using Haversine approximation
  if (sqliteText.includes('ST_DWithin') || sqliteText.includes('ST_Distance')) {
    return handleGeoQuery(text, params || []);
  }

  const isSelect = sqliteText.trim().toUpperCase().startsWith('SELECT');
  
  try {
    if (isSelect) {
      const rows = db.prepare(sqliteText).all(...sqliteParams);
      return { rows, rowCount: rows.length };
    } else {
      // For INSERT with RETURNING, do insert then fetch
      if (text.includes('RETURNING')) {
        const insertSql = sqliteText.trim();
        db.prepare(insertSql).run(...sqliteParams);
        
        // For user insert, return the last inserted user
        if (text.includes('INTO users')) {
          const email = sqliteParams[0]; // email is first param
          const row = db.prepare('SELECT id, email, role, first_name, last_name FROM users WHERE email = ?').get(email);
          return { rows: row ? [row] : [], rowCount: 1 };
        }
        return { rows: [], rowCount: 1 };
      }
      
      const result = db.prepare(sqliteText).run(...sqliteParams);
      return { rows: [], rowCount: result.changes };
    }
  } catch (error: any) {
    console.error('SQLite query error:', error.message);
    console.error('Query:', sqliteText);
    throw error;
  }
}

function handleGeoQuery(originalText: string, params: any[]) {
  // Simplified: find babysitters and calculate distance using Haversine formula in JS
  const longitude = params[0] as number;
  const latitude = params[1] as number;
  const radiusKm = params[2] as number || 10;

  const rows = db.prepare(`
    SELECT u.id, u.first_name, u.last_name, u.avatar_url, u.city, u.latitude, u.longitude,
           bp.hourly_rate, bp.experience_years, bp.bio, bp.rating, bp.total_reviews,
           bp.certifications, bp.available_days
    FROM users u
    JOIN babysitter_profiles bp ON u.id = bp.user_id
    WHERE u.role = 'babysitter' AND u.latitude IS NOT NULL AND u.longitude IS NOT NULL
  `).all() as any[];

  // Calculate Haversine distance and filter
  const results = rows
    .map(row => ({
      ...row,
      distance_km: haversineDistance(latitude, longitude, row.latitude, row.longitude),
    }))
    .filter(row => row.distance_km <= radiusKm)
    .sort((a, b) => a.distance_km - b.distance_km)
    .slice(0, 50);

  return { rows: results, rowCount: results.length };
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

export const pool: { end: () => Promise<void> } = { end: async () => { db.close(); } };
