import 'dotenv/config';
import env from './utils/env';
import app from './app';
import connectDB from './infrastructure/db';

const startServer = async () => {
  try {
    await connectDB(); 
    console.log('Database connected successfully');

    app.listen(env.PORT, () => {
      console.log(`🚀 Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
    });

  } catch (error) {
    console.error('Critical Error: Failed to start server');
    console.error(error);
    process.exit(1);
  }
};

startServer();