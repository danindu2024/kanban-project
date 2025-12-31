import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes';
import boardRoutes from './routes/boardRoutes';
import { errorHandler } from './middleware/errorHandler';
import env from './utils/env';
import { apiLimiter } from './middleware/rateLimiter';
import morgan from 'morgan';

const app = express();

// parse JSON request bodies
app.use(express.json());

// HTTP Request Logging
if (env.NODE_ENV !== 'test') {
  app.use(morgan('combined')); // Use 'dev' for colored output in development
}

// Cross-Origin Resource Sharing
app.use(cors({
  origin: env.NODE_ENV === 'production' 
    ? env.FRONTEND_URL
    : 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE']
})); 

// Rate Limiting
app.use('/api', apiLimiter);

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