import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes';
import boardRoutes from './routes/boardRoutes';
import columnRoutes from './routes/columnRoutes';
import taskRoutes from './routes/taskRoutes'
import { errorHandler } from './middleware/errorHandler';
import env from './utils/env';
import { apiLimiter } from './middleware/rateLimiter';
import morgan from 'morgan';
import { AppError } from './utils/AppError';
import { ErrorCodes } from './constants/errorCodes';

const app = express();

// parse JSON request bodies
app.use(express.json());

// HTTP Request Logging
if (env.NODE_ENV !== 'test') {
  app.use(morgan('combined', {
    skip: (req: Request) => req.path.includes('/auth/') // Skip logging auth routes
  }));
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
app.use("api/columns", columnRoutes);
app.use("api/tasks", taskRoutes)

// Health Check
app.get('/', (req, res) => {
  res.send('API is running...');
});

// 404 Handler (Missing Route)
app.use((req: Request, res: Response, next: NextFunction) => {
  next(new AppError(
      ErrorCodes.URL_NOT_FOUND, 
      'URL not found', 
      404 // Standard code for "Not Found"
    ));
});

// Global Error Handler
app.use(errorHandler);

export default app;