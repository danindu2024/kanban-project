import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes';
import boardRoutes from './routes/boardRoutes';
import { errorHandler } from './middleware/errorHandler';

const app = express();

// Middleware
app.use(express.json());

// Cross-Origin Resource Sharing
app.use(cors()); 

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/boards', boardRoutes);

// Health Check
app.get('/', (req, res) => {
  res.send('API is running...');
});

// 404 Handler (Missing Route)
app.use((req: Request, res: Response, next: NextFunction) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
});

// Global Error Handler
app.use(errorHandler);

export default app;