import express from 'express';
import { AuthController } from '../controllers/authController';
import { UserRepository } from '../infrastructure/repositories/UserRepository';
import { protect } from '../middleware/authMiddleware';
import { authLimiter } from '../middleware/rateLimiter';

const router = express.Router();

// Create dependencies once
const userRepository = new UserRepository();
const authController = new AuthController(userRepository);

router.post('/register', authLimiter, authController.registerUser);
router.post('/login', authLimiter, authController.loginUser);
router.get('/me', protect, authController.getCurrentUser);

export default router;