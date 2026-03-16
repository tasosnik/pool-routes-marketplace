import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { authenticateToken } from '../middleware/auth';
import { validate, registerSchema, loginSchema, updateProfileSchema, changePasswordSchema } from '../utils/validation';

const router = Router();

// Public routes
router.post('/register', validate(registerSchema), AuthController.register);
router.post('/login', validate(loginSchema), AuthController.login);
router.post('/refresh', AuthController.refreshToken);

// Protected routes
router.use(authenticateToken); // All routes below require authentication

router.get('/profile', AuthController.getProfile);
router.put('/profile', validate(updateProfileSchema), AuthController.updateProfile);
router.post('/change-password', validate(changePasswordSchema), AuthController.changePassword);
router.post('/verify-token', AuthController.verifyToken);
router.post('/logout', AuthController.logout);

export default router;