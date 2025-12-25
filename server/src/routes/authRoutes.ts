import express from 'express';
import { AuthController } from '../controllers/authController';
import { UserRepository } from '../infrastructure/repositories/UserRepository';

const router = express.Router();

// Create dependencies once
const userRepository = new UserRepository();
const authController = new AuthController(userRepository);

router.post('/register', authController.registerUser);
router.post('/login', authController.loginUser);

export default router;