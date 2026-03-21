import type { Config } from 'jest';

const config: Config = {
    // Use ts-jest to process TypeScript files
    preset: 'ts-jest',

    // Node environment (not browser)
    testEnvironment: 'node',

    // Root directory for tests
    roots: ['<rootDir>/tests'],

    // Test file pattern
    testMatch: ['**/*.test.ts'],

    // Module file extensions
    moduleFileExtensions: ['ts', 'js', 'json'],

    // Load test environment variables before any test module
    setupFiles: ['<rootDir>/tests/setup.ts'],

    // Coverage configuration
    collectCoverageFrom: [
        'src/**/*.ts',
        '!src/server.ts',      // exclude server startup
        '!src/infrastructure/**', // exclude infra layer for unit tests
    ],

    // Coverage thresholds
    coverageThreshold: {
        global: {
            statements: 80,
            branches: 75,
            functions: 85,
            lines: 80,
        },
    },

    // Clear mocks between tests
    clearMocks: true,

    // Verbose output
    verbose: true,

    // coverage report
    collectCoverage: true,
    coverageDirectory: "coverage",
    coverageProvider: "v8",
};

export default config;
