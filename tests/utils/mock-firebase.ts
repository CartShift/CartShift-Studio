import { vi } from 'vitest';
import type { User } from 'firebase/auth';

export const mockUser: User = {
  uid: 'test-user-id',
  email: 'test@example.com',
  displayName: 'Test User',
  photoURL: null,
  emailVerified: true,
  isAnonymous: false,
  metadata: {
    creationTime: '2024-01-01T00:00:00.000Z',
    lastSignInTime: '2024-01-01T00:00:00.000Z',
  },
  providerData: [],
  refreshToken: 'mock-refresh-token',
  tenantId: null,
  delete: vi.fn().mockResolvedValue(undefined),
  getIdToken: vi.fn().mockResolvedValue('mock-id-token'),
  getIdTokenResult: vi.fn().mockResolvedValue({
    authTime: '2024-01-01T00:00:00.000Z',
    expirationTime: '2024-01-02T00:00:00.000Z',
    issuedAtTime: '2024-01-01T00:00:00.000Z',
    signInProvider: 'password',
    signInSecondFactor: null,
    token: 'mock-id-token',
    claims: {},
  }),
  reload: vi.fn().mockResolvedValue(undefined),
  toJSON: vi.fn().mockReturnValue({}),
} as unknown as User;

export const mockAuth = {
  currentUser: mockUser,
  onAuthStateChanged: vi.fn(callback => {
    callback(mockUser);
    return vi.fn();
  }),
  signInWithEmailAndPassword: vi.fn().mockResolvedValue({ user: mockUser }),
  createUserWithEmailAndPassword: vi.fn().mockResolvedValue({ user: mockUser }),
  signOut: vi.fn().mockResolvedValue(undefined),
  sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
};

export const mockFirestore = {
  collection: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  onSnapshot: vi.fn((_ref, callback) => {
    callback({
      exists: () => true,
      data: () => ({
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        accountType: 'CLIENT',
        isAgency: false,
        organizations: ['org-1'],
        onboardingComplete: true,
      }),
    });
    return vi.fn();
  }),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
};

export function setupFirebaseMocks() {
  vi.mock('@/lib/firebase', () => ({
    getFirebaseAuth: vi.fn(() => mockAuth),
    getFirestoreDb: vi.fn(() => mockFirestore),
    waitForAuth: vi.fn().mockResolvedValue(undefined),
    db: mockFirestore,
    auth: mockAuth,
  }));

  vi.mock('firebase/auth', async () => {
    const actual = await vi.importActual('firebase/auth');
    return {
      ...actual,
      onAuthStateChanged: vi.fn((_auth, callback) => {
        callback(mockUser);
        return vi.fn();
      }),
      signInWithEmailAndPassword: vi.fn().mockResolvedValue({ user: mockUser }),
      createUserWithEmailAndPassword: vi.fn().mockResolvedValue({ user: mockUser }),
      signOut: vi.fn().mockResolvedValue(undefined),
      sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
    };
  });

  vi.mock('firebase/firestore', async () => {
    const actual = await vi.importActual('firebase/firestore');
    return {
      ...actual,
      doc: vi.fn((db, collection, id) => ({ id, collection, db })),
      onSnapshot: vi.fn((_ref, callback) => {
        const mockSnapshot = {
          exists: () => true,
          data: () => ({
            id: 'test-user-id',
            email: 'test@example.com',
            name: 'Test User',
            accountType: 'CLIENT',
            isAgency: false,
            organizations: ['org-1'],
            onboardingComplete: true,
          }),
          docs: [],
        };
        callback(mockSnapshot);
        return vi.fn();
      }),
      collection: vi.fn(),
      query: vi.fn((...args) => ({ _query: args })),
      where: vi.fn((...args) => ({ _where: args })),
      orderBy: vi.fn((...args) => ({ _orderBy: args })),
      limit: vi.fn((...args) => ({ _limit: args })),
      getDoc: vi.fn(),
      setDoc: vi.fn(),
      updateDoc: vi.fn(),
      deleteDoc: vi.fn(),
    };
  });
}

export function mockUserData(overrides = {}) {
  return {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    accountType: 'CLIENT' as const,
    isAgency: false,
    organizations: ['org-1'],
    onboardingComplete: true,
    ...overrides,
  };
}
