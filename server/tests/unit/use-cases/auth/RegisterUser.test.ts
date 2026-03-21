import { RegisterUserUseCase } from '../../../../src/use-cases/auth/RegisterUser';
import { IUserRepository } from '../../../../src/domain/repositories/IUserRepository';
import { AppError } from '../../../../src/utils/AppError';
import { ErrorCodes } from '../../../../src/constants/errorCodes';
import { businessRules } from '../../../../src/constants/businessRules';
import { User } from '../../../../src/domain/entities/User';
import bcrypt from 'bcryptjs';
import * as jwtUtils from '../../../../src/utils/jwt';

// ─── Mock External Modules ──────────────────────────────────────────────────
jest.mock('bcryptjs');
jest.mock('../../../../src/utils/jwt');

const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
const mockedJwt = jwtUtils as jest.Mocked<typeof jwtUtils>;

// ─── Test Helpers ────────────────────────────────────────────────────────────

/**
 * Factory: create a mock IUserRepository with all methods stubbed as jest.fn().
 * Each test can override individual methods as needed.
 */
const createMockUserRepository = (): jest.Mocked<IUserRepository> => ({
    findByEmail: jest.fn(),
    findById: jest.fn(),
    findByIds: jest.fn(),
    create: jest.fn(),
});

/**
 * Factory: base valid request DTO.
 * Spread and override individual fields per test case.
 */
const validInput = {
    name: 'John Doe',
    email: 'john@example.com',
    password: 'securePass1',
};

/**
 * Factory: mock User entity returned by the repository after creation.
 */
const createMockUser = (overrides: Partial<User> = {}): User => ({
    id: 'user-id-123',
    name: 'John Doe',
    email: 'john@example.com',
    password_hash: 'hashed_password_abc',
    role: 'user',
    created_at: new Date('2026-01-01T00:00:00Z'),
    updated_at: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
});

// ─── Test Suite ──────────────────────────────────────────────────────────────
describe('RegisterUserUseCase', () => {
    let registerUser: RegisterUserUseCase;
    let mockUserRepository: jest.Mocked<IUserRepository>;

    // Fresh mocks before each test — ensures complete isolation
    beforeEach(() => {
        mockUserRepository = createMockUserRepository();
        registerUser = new RegisterUserUseCase(mockUserRepository);

        // Default happy-path mock setup
        mockedBcrypt.genSalt.mockResolvedValue('mock-salt' as never);
        mockedBcrypt.hash.mockResolvedValue('hashed_password_abc' as never);
        mockedJwt.generateToken.mockReturnValue('mock-jwt-token');
        mockUserRepository.create.mockResolvedValue(createMockUser());
    });

    // ── Helper: assert AppError properties ──────────────────────────
    const expectAppError = async (
        input: { name: string; email: string; password: string },
        expectedCode: string,
        expectedStatus: number,
        expectedMessagePattern?: string | RegExp
    ) => {
        try {
            await registerUser.execute(input);
            // If we reach here, the test should fail
            fail('Expected AppError to be thrown');
        } catch (error) {
            expect(error).toBeInstanceOf(AppError);
            const appError = error as AppError;
            expect(appError.code).toBe(expectedCode);
            expect(appError.statusCode).toBe(expectedStatus);
            if (expectedMessagePattern) {
                if (typeof expectedMessagePattern === 'string') {
                    expect(appError.message).toBe(expectedMessagePattern);
                } else {
                    expect(appError.message).toMatch(expectedMessagePattern);
                }
            }
        }
    };

    // ═══════════════════════════════════════════════════════════════
    //  SUCCESS CASES
    // ═══════════════════════════════════════════════════════════════
    describe('Success Cases', () => {
        it('should register a user with valid inputs and return token + user', async () => {
            const result = await registerUser.execute(validInput);

            // Assert: response structure
            expect(result).toEqual({
                token: 'mock-jwt-token',
                user: {
                    id: 'user-id-123',
                    name: 'John Doe',
                    email: 'john@example.com',
                    role: 'user',
                    created_at: expect.any(Date),
                },
            });

            // Assert: repository called with sanitized & hashed data
            expect(mockUserRepository.create).toHaveBeenCalledWith({
                name: 'John Doe',
                email: 'john@example.com',
                password_hash: 'hashed_password_abc',
                role: 'user',
            });

            // Assert: token generated with user ID
            expect(mockedJwt.generateToken).toHaveBeenCalledWith('user-id-123');
        });

        /*it('should trim whitespace from name, email, and password', async () => {
            const inputWithSpaces = {
                name: '  John Doe  ',
                email: '  JOHN@EXAMPLE.COM  ',
                password: '  securePass1  ',
            };

            await registerUser.execute(inputWithSpaces);

            expect(mockUserRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    name: 'John Doe',
                    email: 'john@example.com',
                })
            );
        });

        it('should lowercase the email before saving', async () => {
            await registerUser.execute({ ...validInput, email: 'JOHN@EXAMPLE.COM' });

            expect(mockUserRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({ email: 'john@example.com' })
            );
        });

        it('should hash the password and never store plain text', async () => {
            await registerUser.execute(validInput);

            expect(mockedBcrypt.genSalt).toHaveBeenCalledWith(10);
            expect(mockedBcrypt.hash).toHaveBeenCalledWith('securePass1', 'mock-salt');
            expect(mockUserRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({ password_hash: 'hashed_password_abc' })
            );
            // Ensure plain password is never passed to repository
            expect(mockUserRepository.create).not.toHaveBeenCalledWith(
                expect.objectContaining({ password: expect.anything() })
            );
        });

        it('should not include password_hash or extra fields in the response DTO', async () => {
            const result = await registerUser.execute(validInput);

            // Only these keys should be in user object
            const userKeys = Object.keys(result.user);
            expect(userKeys).toEqual(expect.arrayContaining(['id', 'name', 'email', 'role', 'created_at']));
            expect(userKeys).not.toContain('password_hash');
            expect(userKeys).not.toContain('updated_at');
        });*/
    });

    // ═══════════════════════════════════════════════════════════════
    //  MISSING REQUIRED FIELDS
    // ═══════════════════════════════════════════════════════════════
    /*describe('Missing Required Fields', () => {
        it('should throw VAL_002 (400) when name is empty', async () => {
            await expectAppError(
                { ...validInput, name: '' },
                ErrorCodes.MISSING_REQUIRED_FIELDS,
                400,
                'Missing required fields'
            );
        });

        it('should throw VAL_002 (400) when name is only whitespace', async () => {
            await expectAppError(
                { ...validInput, name: '   ' },
                ErrorCodes.MISSING_REQUIRED_FIELDS,
                400
            );
        });

        it('should throw VAL_002 (400) when email is empty', async () => {
            await expectAppError(
                { ...validInput, email: '' },
                ErrorCodes.MISSING_REQUIRED_FIELDS,
                400
            );
        });

        it('should throw VAL_002 (400) when password is empty', async () => {
            await expectAppError(
                { ...validInput, password: '' },
                ErrorCodes.MISSING_REQUIRED_FIELDS,
                400
            );
        });
    });

    // ═══════════════════════════════════════════════════════════════
    //  EMAIL VALIDATION
    // ═══════════════════════════════════════════════════════════════
    describe('Email Validation', () => {
        it('should throw VAL_001 (400) for invalid email format — missing @', async () => {
            await expectAppError(
                { ...validInput, email: 'notanemail' },
                ErrorCodes.VALIDATION_ERROR,
                400,
                'Invalid email format'
            );
        });

        it('should throw VAL_001 (400) for invalid email format — missing domain', async () => {
            await expectAppError(
                { ...validInput, email: 'user@' },
                ErrorCodes.VALIDATION_ERROR,
                400
            );
        });

        it('should throw VAL_001 (400) for invalid email format — missing TLD', async () => {
            await expectAppError(
                { ...validInput, email: 'user@domain' },
                ErrorCodes.VALIDATION_ERROR,
                400
            );
        });

        it(`should throw VAL_003 (400) when email exceeds ${businessRules.MAX_EMAIL_LENGTH} characters`, async () => {
            const longEmail = 'a'.repeat(businessRules.MAX_EMAIL_LENGTH) + '@example.com';
            await expectAppError(
                { ...validInput, email: longEmail },
                ErrorCodes.BUSINESS_RULE_VIOLATION,
                400,
                new RegExp(`must not exceed ${businessRules.MAX_EMAIL_LENGTH}`)
            );
        });
    });

    // ═══════════════════════════════════════════════════════════════
    //  PASSWORD VALIDATION
    // ═══════════════════════════════════════════════════════════════
    describe('Password Validation', () => {
        it(`should throw VAL_003 (400) when password is shorter than ${businessRules.MIN_PASSWORD_LENGTH} characters`, async () => {
            const shortPassword = 'x'.repeat(businessRules.MIN_PASSWORD_LENGTH - 1);
            await expectAppError(
                { ...validInput, password: shortPassword },
                ErrorCodes.BUSINESS_RULE_VIOLATION,
                400,
                new RegExp(`at least ${businessRules.MIN_PASSWORD_LENGTH}`)
            );
        });

        it(`should throw VAL_003 (400) when password exceeds ${businessRules.MAX_PASSWORD_LENGTH} characters`, async () => {
            const longPassword = 'x'.repeat(businessRules.MAX_PASSWORD_LENGTH + 1);
            await expectAppError(
                { ...validInput, password: longPassword },
                ErrorCodes.BUSINESS_RULE_VIOLATION,
                400,
                new RegExp(`must not exceed ${businessRules.MAX_PASSWORD_LENGTH}`)
            );
        });

        it(`should accept password of exactly ${businessRules.MIN_PASSWORD_LENGTH} characters`, async () => {
            const exactMinPassword = 'x'.repeat(businessRules.MIN_PASSWORD_LENGTH);
            const result = await registerUser.execute({ ...validInput, password: exactMinPassword });
            expect(result.token).toBeDefined();
        });

        it(`should accept password of exactly ${businessRules.MAX_PASSWORD_LENGTH} characters`, async () => {
            const exactMaxPassword = 'x'.repeat(businessRules.MAX_PASSWORD_LENGTH);
            const result = await registerUser.execute({ ...validInput, password: exactMaxPassword });
            expect(result.token).toBeDefined();
        });
    });

    // ═══════════════════════════════════════════════════════════════
    //  NAME VALIDATION
    // ═══════════════════════════════════════════════════════════════
    describe('Name Validation', () => {
        it(`should throw VAL_003 (400) when name exceeds ${businessRules.MAX_USERNAME_LENGTH} characters`, async () => {
            const longName = 'A'.repeat(businessRules.MAX_USERNAME_LENGTH + 1);
            await expectAppError(
                { ...validInput, name: longName },
                ErrorCodes.BUSINESS_RULE_VIOLATION,
                400,
                /must not exceed 100/
            );
        });

        it(`should accept name of exactly ${businessRules.MAX_USERNAME_LENGTH} characters`, async () => {
            const exactMaxName = 'A'.repeat(businessRules.MAX_USERNAME_LENGTH);
            const result = await registerUser.execute({ ...validInput, name: exactMaxName });
            expect(result.token).toBeDefined();
        });
    });

    // ═══════════════════════════════════════════════════════════════
    //  REPOSITORY INTERACTION
    // ═══════════════════════════════════════════════════════════════
    describe('Repository Interaction', () => {
        it('should call userRepository.create exactly once', async () => {
            await registerUser.execute(validInput);
            expect(mockUserRepository.create).toHaveBeenCalledTimes(1);
        });

        it('should propagate repository errors to the caller', async () => {
            mockUserRepository.create.mockRejectedValue(new Error('DB connection lost'));

            await expect(registerUser.execute(validInput)).rejects.toThrow('DB connection lost');
        });

        it('should assign the default role as user', async () => {
            await registerUser.execute(validInput);

            expect(mockUserRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({ role: 'user' })
            );
        });
    });*/
});
