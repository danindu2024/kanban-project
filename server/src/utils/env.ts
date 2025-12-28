import { cleanEnv, str, port } from 'envalid';

const env = cleanEnv(process.env, {
  // Validates it exists AND matches the shape (string)
  MONGO_URI: str(),
  JWT_SECRET: str(),
  
  // Validates it exists AND restricts choices
  NODE_ENV: str({ choices: ['development', 'test', 'production', 'staging'] }),
  
  // Validates it exists, and sets a default if missing
  PORT: port({ default: 5000 }),
});

export default env;