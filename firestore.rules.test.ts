/**
 * Phase 0 Security Test Specification for Firestore Rules.
 * Covers the "Dirty Dozen" adversarial payloads defined in security_spec.md.
 */

export interface SecurityTestCase {
  id: string;
  description: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  path: string;
  auth: { uid: string; email_verified: boolean } | null;
  payload?: Record<string, unknown>;
  expected: 'PERMISSION_DENIED';
}

export const dirtyDozenTests: SecurityTestCase[] = [
  {
    id: 'DD-01',
    description: 'Unauthenticated read on /users/user_1',
    operation: 'get',
    path: '/users/user_1',
    auth: null,
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-02',
    description: 'Unverified email create on /users/user_1',
    operation: 'create',
    path: '/users/user_1',
    auth: { uid: 'user_1', email_verified: false },
    payload: {
      uid: 'user_1',
      displayName: 'Alice',
      email: 'alice@example.com',
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-03',
    description: 'Identity spoofing on create (/users/user_2 by user_1)',
    operation: 'create',
    path: '/users/user_2',
    auth: { uid: 'user_1', email_verified: true },
    payload: {
      uid: 'user_2',
      displayName: 'Bob',
      email: 'bob@example.com',
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-04',
    description: 'Cross-user PII read (/users/user_2 by user_1)',
    operation: 'get',
    path: '/users/user_2',
    auth: { uid: 'user_1', email_verified: true },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-05',
    description: 'Collection list scraping on /users',
    operation: 'list',
    path: '/users',
    auth: { uid: 'user_1', email_verified: true },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-06',
    description: 'Shadow field injection (isAdmin: true) on create',
    operation: 'create',
    path: '/users/user_1',
    auth: { uid: 'user_1', email_verified: true },
    payload: {
      uid: 'user_1',
      displayName: 'Alice',
      email: 'alice@example.com',
      isAdmin: true,
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-07',
    description: 'Shadow field injection (role: admin) on update',
    operation: 'update',
    path: '/users/user_1',
    auth: { uid: 'user_1', email_verified: true },
    payload: {
      role: 'admin',
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-08',
    description: 'Immutable uid tampering on update',
    operation: 'update',
    path: '/users/user_1',
    auth: { uid: 'user_1', email_verified: true },
    payload: {
      uid: 'user_2',
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-09',
    description: 'Client-forged createdAt/updatedAt timestamp tampering',
    operation: 'create',
    path: '/users/user_1',
    auth: { uid: 'user_1', email_verified: true },
    payload: {
      uid: 'user_1',
      displayName: 'Alice',
      email: 'alice@example.com',
      createdAt: '2020-01-01T00:00:00Z',
      updatedAt: '2020-01-01T00:00:00Z',
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-10',
    description: 'ID poisoning with oversized invalid path ID',
    operation: 'get',
    path: `/users/${'a'.repeat(200)}`,
    auth: { uid: 'user_1', email_verified: true },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-11',
    description: 'Value poisoning with oversized displayName (>100 chars)',
    operation: 'update',
    path: '/users/user_1',
    auth: { uid: 'user_1', email_verified: true },
    payload: {
      displayName: 'x'.repeat(500),
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-12',
    description: 'Unauthorized read on undeclared collection /admins/user_1',
    operation: 'get',
    path: '/admins/user_1',
    auth: { uid: 'user_1', email_verified: true },
    expected: 'PERMISSION_DENIED',
  },
];
