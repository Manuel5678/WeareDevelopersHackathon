# Firestore Security Specification (Phase 0)

## 1. Data Invariants

1. **Identity Ownership (`/users/{userId}`)**: A user profile document can only be read, created, or updated by the authenticated, email-verified user whose `request.auth.uid` matches both `{userId}` and `request.resource.data.uid`.
2. **No Cross-User PII Exposure**: User profile documents contain `email` (PII). No user may `get` or `list` another user's profile document. Collection `list` on `/users` is completely disabled.
3. **Strict Schema & No Shadow Fields**: Only `uid`, `displayName`, `email`, `createdAt`, and `updatedAt` are permitted on `/users/{userId}` documents. Arbitrary keys such as `role` or `isAdmin` must be rejected.
4. **Temporal & Immutable Field Integrity**: `createdAt` and `uid` must equal `request.time` and `request.auth.uid` at creation and remain immutable on updates. `updatedAt` must equal `request.time` on both creation and update.
5. **Path & Resource Size Hardening**: All document IDs must match `^[a-zA-Z0-9_\-]+$` and be at most 128 characters. All strings have strict `.size()` bounds.

## 2. The "Dirty Dozen" Adversarial Payloads

1. **Unauthenticated Read/Write**: Attempt `get` or `create` on `/users/user_1` with `auth == null` -> `PERMISSION_DENIED`.
2. **Unverified Email Create**: Attempt `create` on `/users/user_1` with `email_verified == false` -> `PERMISSION_DENIED`.
3. **Identity Spoofing on Create**: User `user_1` attempts to `create` `/users/user_2` or sets `uid: "user_2"` -> `PERMISSION_DENIED`.
4. **Cross-User PII Read**: User `user_1` attempts `get` on `/users/user_2` -> `PERMISSION_DENIED`.
5. **Collection Scraping (`list`)**: User `user_1` attempts `list` on `/users` -> `PERMISSION_DENIED`.
6. **Shadow Field Injection on Create**: User `user_1` creates `/users/user_1` with extra field `isAdmin: true` -> `PERMISSION_DENIED`.
7. **Shadow Field Injection on Update**: User `user_1` updates `/users/user_1` adding `role: "admin"` -> `PERMISSION_DENIED`.
8. **Immutable UID Tampering on Update**: User `user_1` updates `/users/user_1` changing `uid` -> `PERMISSION_DENIED`.
9. **Immutable Timestamp Tampering**: User `user_1` updates `/users/user_1` modifying `createdAt` or providing a forged past/future `updatedAt != request.time` -> `PERMISSION_DENIED`.
10. **ID Poisoning**: Attempt `create` or `get` with oversized/invalid path ID (`"a".repeat(200)` or `"bad/id"`) -> `PERMISSION_DENIED`.
11. **Value Poisoning (Oversized String)**: User `user_1` sets `displayName` of 500 characters (> 100 limit) -> `PERMISSION_DENIED`.
12. **Unauthorized Collection Access**: Any read or write to an undeclared path (e.g. `/admin/config`) -> `PERMISSION_DENIED`.
