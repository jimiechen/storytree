import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authStore } from '@/stores/auth-store';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    clear: () => {
      store = {};
    },
    removeItem: (key: string) => {
      delete store[key];
    },
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('Auth Store', () => {
  beforeEach(() => {
    // 清除所有状态
    authStore.setState({ user: null, token: null, isLoading: false, error: null });
    localStorageMock.clear();
  });

  it('should initialize with default state', () => {
    const state = authStore.getState();
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('should set user and token on login', async () => {
    const mockUser = { id: '1', username: 'testuser', email: 'test@example.com' };
    const mockToken = 'test-token-123';

    await authStore.getState().login({ email: 'test@example.com', password: 'password123' });

    const state = authStore.getState();
    expect(state.user).toEqual(mockUser);
    expect(state.token).toBe(mockToken);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
    expect(localStorageMock.getItem('authToken')).toBe(mockToken);
  });

  it('should handle login failure', async () => {
    await authStore.getState().login({ email: 'invalid@example.com', password: 'wrongpassword' });

    const state = authStore.getState();
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(state.isLoading).toBe(false);
    expect(state.error).toBe('Invalid email or password');
  });

  it('should clear user and token on logout', () => {
    // First login to set some state
    authStore.setState({
      user: { id: '1', username: 'testuser', email: 'test@example.com' },
      token: 'test-token-123',
      isLoading: false,
      error: null,
    });

    authStore.getState().logout();

    const state = authStore.getState();
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
    expect(localStorageMock.getItem('authToken')).toBeNull();
  });

  it('should load token from localStorage on initialization', () => {
    const mockToken = 'test-token-123';
    localStorageMock.setItem('authToken', mockToken);

    // Re-initialize store
    authStore.getState();

    const state = authStore.getState();
    expect(state.token).toBe(mockToken);
  });

  it('should handle registration', async () => {
    const mockUser = { id: '1', username: 'newuser', email: 'newuser@example.com' };

    await authStore.getState().register({ username: 'newuser', email: 'newuser@example.com', password: 'password123' });

    const state = authStore.getState();
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('should handle registration failure', async () => {
    await authStore.getState().register({ username: 'existinguser', email: 'existing@example.com', password: 'password123' });

    const state = authStore.getState();
    expect(state.isLoading).toBe(false);
    expect(state.error).toBe('Registration failed');
  });
});
