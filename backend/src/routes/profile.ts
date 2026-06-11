import { Router, Response } from 'express';
import { query } from '../db/pool';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/profile
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    
    let result;
    if (user.role === 'parent') {
      result = await query(
        `SELECT u.id, u.email, u.role, u.first_name, u.last_name, u.phone, u.avatar_url, u.city, u.address,
                pp.number_of_children, pp.children_ages, pp.special_needs, pp.bio
         FROM users u
         LEFT JOIN parent_profiles pp ON u.id = pp.user_id
         WHERE u.id = $1`,
        [user.id]
      );
    } else {
      result = await query(
        `SELECT u.id, u.email, u.role, u.first_name, u.last_name, u.phone, u.avatar_url, u.city, u.address,
                bp.hourly_rate, bp.experience_years, bp.bio, bp.certifications, bp.available_days, bp.rating, bp.total_reviews
         FROM users u
         LEFT JOIN babysitter_profiles bp ON u.id = bp.user_id
         WHERE u.id = $1`,
        [user.id]
      );
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json({ profile: result.rows[0] });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/profile
router.patch('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const { firstName, lastName, phone, city, address, latitude, longitude, ...profileData } = req.body;

    // Update user base fields
    if (firstName || lastName || phone || city || address || (latitude && longitude)) {
      const setClauses: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (firstName) { setClauses.push(`first_name = $${paramIndex++}`); values.push(firstName); }
      if (lastName) { setClauses.push(`last_name = $${paramIndex++}`); values.push(lastName); }
      if (phone) { setClauses.push(`phone = $${paramIndex++}`); values.push(phone); }
      if (city) { setClauses.push(`city = $${paramIndex++}`); values.push(city); }
      if (address) { setClauses.push(`address = $${paramIndex++}`); values.push(address); }
      if (latitude && longitude) {
        setClauses.push(`location = ST_SetSRID(ST_MakePoint($${paramIndex++}, $${paramIndex++}), 4326)::geography`);
        values.push(longitude, latitude);
      }

      setClauses.push(`updated_at = NOW()`);
      values.push(user.id);

      await query(
        `UPDATE users SET ${setClauses.join(', ')} WHERE id = $${paramIndex}`,
        values
      );
    }

    // Update role-specific profile
    if (user.role === 'parent' && Object.keys(profileData).length > 0) {
      const { numberOfChildren, childrenAges, specialNeeds, bio } = profileData;
      await query(
        `UPDATE parent_profiles SET 
          number_of_children = COALESCE($1, number_of_children),
          children_ages = COALESCE($2, children_ages),
          special_needs = COALESCE($3, special_needs),
          bio = COALESCE($4, bio)
         WHERE user_id = $5`,
        [numberOfChildren, childrenAges, specialNeeds, bio, user.id]
      );
    } else if (user.role === 'babysitter' && Object.keys(profileData).length > 0) {
      const { hourlyRate, experienceYears, bio, certifications, availableDays } = profileData;
      await query(
        `UPDATE babysitter_profiles SET 
          hourly_rate = COALESCE($1, hourly_rate),
          experience_years = COALESCE($2, experience_years),
          bio = COALESCE($3, bio),
          certifications = COALESCE($4, certifications),
          available_days = COALESCE($5, available_days)
         WHERE user_id = $6`,
        [hourlyRate, experienceYears, bio, certifications, availableDays, user.id]
      );
    }

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
