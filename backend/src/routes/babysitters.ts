import { Router, Response } from 'express';
import { query } from '../db/pool';
import { authenticate, AuthRequest, authorize } from '../middleware/auth';

const router = Router();

// GET /api/babysitters/nearby?lat=xx&lng=xx&radius=10
router.get('/nearby', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { lat, lng, radius = '10' } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'lat and lng query parameters are required' });
    }

    const radiusKm = parseFloat(radius as string);
    const latitude = parseFloat(lat as string);
    const longitude = parseFloat(lng as string);

    const result = await query(
      `SELECT 
        u.id, u.first_name, u.last_name, u.avatar_url, u.city,
        bp.hourly_rate, bp.experience_years, bp.bio, bp.rating, bp.total_reviews,
        bp.certifications, bp.available_days,
        ST_Distance(u.location, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) / 1000 AS distance_km
      FROM users u
      JOIN babysitter_profiles bp ON u.id = bp.user_id
      WHERE u.role = 'babysitter'
        AND u.location IS NOT NULL
        AND ST_DWithin(u.location, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3 * 1000)
      ORDER BY distance_km ASC
      LIMIT 50`,
      [longitude, latitude, radiusKm]
    );

    res.json({ babysitters: result.rows });
  } catch (error) {
    console.error('Nearby search error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/babysitters/:id
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      `SELECT 
        u.id, u.first_name, u.last_name, u.avatar_url, u.city, u.phone,
        bp.hourly_rate, bp.experience_years, bp.bio, bp.rating, bp.total_reviews,
        bp.certifications, bp.available_days
      FROM users u
      JOIN babysitter_profiles bp ON u.id = bp.user_id
      WHERE u.id = $1 AND u.role = 'babysitter'`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Babysitter not found' });
    }

    res.json({ babysitter: result.rows[0] });
  } catch (error) {
    console.error('Get babysitter error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
