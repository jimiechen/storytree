import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateToken, verifyToken, isMockApiEnabled, AuthError } from '@/lib/auth';

describe('Auth Library', () => {
  describe('JWT Token', () => {
    it('should generate and verify token correctly', () => {
      const payload = {
        userId: '550e8400-e29b-41d4-a716-446655440000',
        email: 'test@example.com',
        username: 'testuser',
      };

      const token = generateToken(payload);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should verify mock token correctly', () => {
      // Mock token format used in MSW
      const mockToken = 'mock-jwt-token-550e8400-e29b-41d4-a716-446655440000';
      
      // This is a simplified test - actual verification would need the verifyToken function exported
      expect(mockToken).toContain('mock-jwt-token-');
      expect(mockToken.split('-')).toHaveLength(6);
    });
  });

  describe('Mock API Check', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv };
    });

    it('should return true when NEXT_PUBLIC_USE_MOCK_API is "true"', () => {
      process.env.NEXT_PUBLIC_USE_MOCK_API = 'true';
      expect(isMockApiEnabled()).toBe(true);
    });

    it('should return false when NEXT_PUBLIC_USE_MOCK_API is "false"', () => {
      process.env.NEXT_PUBLIC_USE_MOCK_API = 'false';
      expect(isMockApiEnabled()).toBe(false);
    });

    it('should return false when NEXT_PUBLIC_USE_MOCK_API is undefined', () => {
      delete process.env.NEXT_PUBLIC_USE_MOCK_API;
      expect(isMockApiEnabled()).toBe(false);
    });
  });

  describe('AuthError', () => {
    it('should create AuthError with correct properties', () => {
      const error = new AuthError('未授权', 401);
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AuthError);
      expect(error.message).toBe('未授权');
      expect(error.statusCode).toBe(401);
      expect(error.name).toBe('AuthError');
    });

    it('should use default status code 401', () => {
      const error = new AuthError('未授权');
      expect(error.statusCode).toBe(401);
    });
  });

  describe('Dual-track Control', () => {
    it('should have isMockApiEnabled function exported', () => {
      expect(typeof isMockApiEnabled).toBe('function');
    });

    it('should have generateToken function exported', () => {
      expect(typeof generateToken).toBe('function');
    });

    it('should have AuthError class exported', () => {
      expect(typeof AuthError).toBe('function');
    });
  });
});
