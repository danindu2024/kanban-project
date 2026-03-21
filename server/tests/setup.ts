/**
 * Jest Setup File
 * 
 * Sets required environment variables before any test module is loaded.
 * This prevents `envalid` in `env.ts` from throwing during test execution.
 * 
 * Referenced by jest.config.ts → setupFiles
 */

process.env.NODE_ENV = 'test';
process.env.MONGO_URI = 'mongodb://localhost:27017/kanban-test';
process.env.JWT_SECRET = 'test-jwt-secret-key-must-be-at-least-32-chars-long';
process.env.FRONTEND_URL = 'http://localhost:3000';
process.env.PORT = '5000';
