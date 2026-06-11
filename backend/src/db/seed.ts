import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';

const dbPath = path.join(__dirname, '..', '..', 'dev.db');
const db = new Database(dbPath);

async function seed() {
  console.log('Seeding database with sample data...');

  const passwordHash = await bcrypt.hash('password123', 10);

  // Sample babysitters
  const babysitters = [
    { email: 'sarah@example.com', firstName: 'Sarah', lastName: 'Cohen', city: 'Tel Aviv', lat: 32.0853, lng: 34.7818, hourlyRate: 50, exp: 3, bio: 'Experienced babysitter, love working with toddlers. CPR certified.', days: 'Monday,Wednesday,Friday' },
    { email: 'maya@example.com', firstName: 'Maya', lastName: 'Levi', city: 'Tel Aviv', lat: 32.0900, lng: 34.7750, hourlyRate: 60, exp: 5, bio: 'Certified early childhood educator. Great with ages 2-8. I bring crafts and activities!', days: 'Tuesday,Thursday,Saturday' },
    { email: 'daniel@example.com', firstName: 'Daniel', lastName: 'Rosen', city: 'Ramat Gan', lat: 32.0680, lng: 34.8240, hourlyRate: 45, exp: 2, bio: 'College student studying education. Patient and energetic. Available evenings.', days: 'Monday,Tuesday,Wednesday,Thursday,Friday' },
    { email: 'noa@example.com', firstName: 'Noa', lastName: 'Ben-David', city: 'Herzliya', lat: 32.1629, lng: 34.7911, hourlyRate: 70, exp: 8, bio: 'Professional nanny with 8 years experience. Specializing in infant care and sleep training.', days: 'Monday,Tuesday,Wednesday,Thursday' },
    { email: 'yael@example.com', firstName: 'Yael', lastName: 'Shapira', city: 'Tel Aviv', lat: 32.0750, lng: 34.7900, hourlyRate: 55, exp: 4, bio: 'Fun and responsible! I teach kids through play. Former camp counselor. First aid certified.', days: 'Wednesday,Thursday,Friday,Saturday' },
  ];

  for (const b of babysitters) {
    // Check if already exists
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(b.email);
    if (existing) continue;

    const id = Buffer.from(Array.from({ length: 16 }, () => Math.floor(Math.random() * 256))).toString('hex');

    db.prepare(
      `INSERT INTO users (id, email, password_hash, role, first_name, last_name, city, latitude, longitude)
       VALUES (?, ?, ?, 'babysitter', ?, ?, ?, ?, ?)`
    ).run(id, b.email, passwordHash, b.firstName, b.lastName, b.city, b.lat, b.lng);

    db.prepare(
      `INSERT INTO babysitter_profiles (user_id, hourly_rate, experience_years, bio, available_days, rating, total_reviews)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(id, b.hourlyRate, b.exp, b.bio, b.days, (3.5 + Math.random() * 1.5).toFixed(1), Math.floor(Math.random() * 20) + 1);
  }

  console.log(`Seeded ${babysitters.length} babysitters.`);
  db.close();
}

seed();
