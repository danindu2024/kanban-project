import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes';
import boardRoutes from './routes/boardRoutes';
import { errorHandler } from './middleware/errorHandler';

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/boards', boardRoutes);

// Basic route
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Error handler
app.use(errorHandler);

export default app;