export const ErrorCodes = {
  // Auth errors
  INVALID_CREDENTIALS: 'AUTH_001',
  TOKEN_EXPIRED: 'AUTH_002',
  TOKEN_INVALID: 'AUTH_003',
  USER_NOT_AUTHENTICATED: 'AUTH_004',
  
  // Board errors
  BOARD_NOT_FOUND: 'BOARD_001',
  BOARD_ACCESS_DENIED: 'BOARD_002',

  // User errors
  USER_NOT_FOUND: 'USER_001',
  USER_ALREADY_EXISTS: 'USER_002',
  
  // Task errors
  TASK_NOT_FOUND: 'TASK_001',
  TASK_INVALID_COLUMN: 'TASK_002',
  
  // Validation errors
  VALIDATION_ERROR: 'VAL_001',
  MISSING_INPUT: 'VAL_002',
  
  // Rate limiting
  RATE_LIMIT_EXCEEDED: 'RATE_001',

  // URL not found
  URL_NOT_FOUND: 'URL_001',

  // Internal server error
  INTERNAL_ERROR: 'SERVER_001',
} as const;