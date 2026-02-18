import express from 'express'
import { addUserRole, loginUser, myProfile } from '../controllers/auth.js';
import { isAuth } from '../middleware/isAuth.js';

const router = express.Router();

router.post('/login', loginUser);
router.put('/add/role', isAuth, addUserRole);
router.get('/me', isAuth, myProfile);

export default router;

// 1:35::08 