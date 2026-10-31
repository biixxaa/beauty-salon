// backend/src/routes/profile.routes.ts
import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../data/db.js';
import { AuthRequest } from '../middleware/auth.middleware.js';

const router = Router();

// GET /api/profile/employee
router.get('/employee', (req: AuthRequest, res: Response) => {
  const user = req.user || db.users.get('usr-employee-1');
  res.json({
    id: user?.id || 'usr-employee-1',
    name: user?.name || 'Dawit Alemu',
    bio: 'Certified master stylist with 8+ years specializing in modern fades, hair design, and luxury treatments.',
    resumeUrl: '',
    avatarUrl: user?.avatarUrl || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200',
    rating: 4.9,
    user: {
      email: user?.email || 'dawit@bolegrooming.et',
      phone: user?.phone || '+251 922 445566',
    },
    salon: {
      id: 'salon-2',
      name: "Bole Gentlemen's Grooming Lounge",
    },
  });
});

// PUT /api/profile/employee
router.put('/employee', (req: AuthRequest, res: Response) => {
  const user = req.user || db.users.get('usr-employee-1');
  const { bio, resumeUrl, avatarUrl } = req.body || {};

  if (user) {
    if (avatarUrl) user.avatarUrl = avatarUrl;
  }

  res.json({
    id: user?.id || 'usr-employee-1',
    name: user?.name || 'Dawit Alemu',
    bio: bio || '',
    resumeUrl: resumeUrl || '',
    avatarUrl: avatarUrl || user?.avatarUrl,
    rating: 4.9,
    user: {
      email: user?.email || 'dawit@bolegrooming.et',
      phone: user?.phone || '+251 922 445566',
    },
    salon: {
      id: 'salon-2',
      name: "Bole Gentlemen's Grooming Lounge",
    },
  });
});

// POST /api/profile/change-password
router.post('/change-password', async (req: AuthRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!newPassword) {
    res.status(400).json({ error: 'New password is required' });
    return;
  }

  const user = req.user || db.users.get('usr-employee-1');
  if (user?.passwordHash && currentPassword) {
    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      res.status(400).json({ error: 'Current password does not match' });
      return;
    }
  }

  if (user) {
    user.passwordHash = await bcrypt.hash(newPassword, 10);
  }

  res.json({ message: 'Password updated successfully' });
});

export default router;

