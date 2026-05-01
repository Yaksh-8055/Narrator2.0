# Authentication Refactoring Report

## Overview

This report documents the comprehensive refactoring needed for the Story Narrator application's authentication system. The current implementation uses IBM App ID with localStorage-based token storage, which presents security vulnerabilities including XSS exposure and lack of refresh token support. The refactoring will introduce HttpOnly cookies, refresh token handling, improved session management, and a centralized authentication library.

**Key Objectives:**

- Eliminate localStorage token storage vulnerability
- Implement refresh token rotation
- Add session timeout handling
- Create centralized auth utilities
- Fix documentation inconsistencies

## Files to Delete

The following files require deletion as part of the refactoring:

1. **`app/api/auth/token/route.ts`** - Authentication logic moves to `lib/auth.ts` with refresh token support
2. **`app/api/auth/validate/route.ts`** - Validation logic consolidated into `lib/auth.ts`
3. **`lib/appid.ts`** - Replaced by new `lib/auth.ts` with enhanced security features

## Files to Modify

The following 12+ files require modifications:

### Core Authentication Files

1. **`components/AuthGuard.tsx`** (Lines 1-108)
   - Update file header comment (currently incorrectly references LoginForm.tsx)
   - Replace localStorage token access with cookie-based retrieval
   - Import authentication utilities from new `lib/auth.ts`

2. **`components/LoginForm.tsx`** (Lines 1-161)
   - Modify token storage from localStorage to cookie-based approach
   - Update import statements to reference new auth library
   - Adjust success handling to work with refresh tokens

3. **`app/login/page.tsx`** (Lines 1-86)
   - Replace localStorage token checks with cookie-based validation
   - Update authentication validation calls to new API structure

### Protected Routes

4. **`app/page.tsx`** (Lines 1-170)
   - AuthGuard integration already present; update imports

5. **`app/library/page.tsx`** (Lines 1-131)
   - Already protected by AuthGuard; verify cookie-based flow

### API Routes

6. **`app/api/tts/route.ts`** (Lines 1-123)
   - Update `validateAccessToken` import to use new auth library
   - Verify cookie-based authentication flow

7. **`app/api/story/generate/route.ts`** (Lines 1-84)
   - Update authentication imports to new library
   - Ensure proper token validation

8. **`app/api/cloudant/list/route.ts`** (Lines 1-44)
   - Update authentication imports

9. **`app/api/cloudant/save/route.ts`** (Lines 1-107)
   - Update authentication imports

### Supporting Files

10. **`types/index.ts`** (Lines 121-141)
    - Add new authentication types for refresh tokens and session state
    - Update `AuthState` interface for cookie-based storage

11. **`app/layout.tsx`** - Verify no auth-related code present
12. **`components/StoryGenerator.tsx`** - Verify token usage with new auth flow
13. **`components/LibraryView.tsx`** - Verify token usage with new auth flow

## Files to Create

### New File: `lib/auth.ts`

This new centralized authentication library will replace `lib/appid.ts` and provide:

```typescript
// Core functionality:
// - Token validation with cookie support
// - Refresh token rotation
// - Session timeout management
// - Secure token extraction from HttpOnly cookies
// - Logout functionality with cookie clearing
```

**Key Exports:**

- `validateAccessToken(token: string): Promise<AppIdUser>` - Validates JWT tokens
- `extractBearerToken(authHeader: string | null): string` - Extracts Bearer token
- `exchangeCredentials(email: string, password: string): Promise<AuthTokens>` - ROPC grant with refresh token support
- `getAuthToken(): Promise<string | null>` - Retrieves token from HttpOnly cookie
- `clearAuthSession(): void` - Clears all auth cookies on logout
- `refreshAuthToken(refreshToken: string): Promise<AuthTokens>` - Rotates refresh tokens

## Risk Assessment

### Security Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| XSS token theft via localStorage | High | Critical | Move to HttpOnly cookies |
| Token replay attacks | Medium | High | Implement refresh token rotation with short expiration |
| Session hijacking | Low | High | Add CSRF tokens and session binding |
| Token expiration during use | Medium | Medium | Implement silent refresh before expiration |

### Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Cookie size limits | Low | Medium | Keep tokens under 4KB |
| Cross-site cookie blocking | Low | Medium | Use SameSite=Strict appropriately |
| Server restart clears in-memory JWKS cache | Medium | Low | Implement persistent JWKS caching with TTL |
| IBM App ID downtime | Low | High | Implement retry logic with exponential backoff |

### Compatibility Risks

- **Browser Support**: HttpOnly cookies work in all modern browsers but require SameSite policy consideration
- **Mobile WebView**: Some mobile webviews have limited cookie support; implement fallback detection
- **Serverless Cold Starts**: Token validation may fail during cold starts; add initialization retry logic

## Step-by-Step Procedure

### Phase 1: Preparation

**Step 1: Create Backup**
```bash
# Create backup branch
git backup create auth-refactor-backup
```

**Step 2: Review Current Dependencies**
- Verify `jose` library version in `package.json`
- Confirm IBM App ID credentials in environment

### Phase 2: New Authentication Library

**Step 3: Create `lib/auth.ts`**
- Location: `A:/story-narrator_Edited/lib/auth.ts`
- Implement token validation, refresh token rotation, cookie management
- Include proper TypeScript types and error handling

**Step 4: Update `types/index.ts`**
- Add `RefreshToken` type
- Add `AuthTokens` interface (accessToken, refreshToken, expiresAt)
- Update `AuthState` interface

### Phase 3: Authentication Flow Updates

**Step 5: Update `components/LoginForm.tsx`**
- Location: `A:/story-narrator_Edited/components/LoginForm.tsx`
- Lines 61-62: Replace localStorage.setItem with cookie setter
- Update import statement (Line 18): Change to import from `@/lib/auth`
- Lines 33-36: Modify token response handling to store refresh token

**Step 6: Fix `components/AuthGuard.tsx` Header**
- Location: `A:/story-narrator_Edited/components/AuthGuard.tsx`
- Line 2: Correct file reference in comment (change "LoginForm.tsx" to "AuthGuard.tsx")
- Lines 50-51: Replace localStorage.getItem with cookie-based retrieval
- Lines 67: Update to refresh user from cookie-based session

**Step 7: Update `app/login/page.tsx`**
- Location: `A:/story-narrator_Edited/app/login/page.tsx`
- Lines 34, 44: Replace localStorage access with cookie validation
- Lines 54-55: Update to clear cookies instead of localStorage

### Phase 4: API Route Updates

**Step 8: Update API Routes**

- **`app/api/tts/route.ts`** (Line 18): Update import
- **`app/api/story/generate/route.ts`** (Line 18): Update import
- **`app/api/cloudant/list/route.ts`** (Line 14): Update import
- **`app/api/cloudant/save/route.ts`** (Line 14): Update import

**Step 9: Delete Old Auth Files**
```bash
# Remove replaced files
rm app/api/auth/token/route.ts
rm app/api/auth/validate/route.ts
rm lib/appid.ts
```

### Phase 5: Testing and Validation

**Step 10: Verify Login Flow**
- Test login form submission
- Confirm cookie storage (verify HttpOnly flag)
- Test redirect after successful login

**Step 11: Verify Protected Routes**
- Test access to `/` without authentication (should redirect to `/login`)
- Test access to `/library` without authentication (should redirect to `/login`)
- Verify AuthGuard validation works with new cookie-based approach

**Step 12: Verify API Authentication**
- Test story generation API with valid token
- Test story generation API without token (should return 401)
- Test TTS API with valid token
- Test Cloudant list/save APIs

**Step 13: Verify Session Management**
- Test session timeout handling
- Test logout functionality (cookies cleared)
- Test refresh token rotation

## Rollback Plan

### Immediate Rollback (Same Day)

If critical issues are discovered within 24 hours:

1. **Restore from Git Backup**
   ```bash
   git checkout auth-refactor-backup -- .
   git commit -m "Rollback: Revert authentication refactoring"
   ```

2. **Restore Database**
   - No database schema changes were made; Cloudant data is intact

3. **Restore Environment**
   - No environment variable changes required
   - IBM App ID configuration remains unchanged

### Gradual Rollback (Within 1 Week)

If issues are discovered after initial deployment but within 1 week:

1. **Revert to Previous Commit**
   ```bash
   git revert HEAD
   # Or for multiple commits:
   git revert HEAD~3..HEAD
   ```

2. **Coordinate with Team**
   - Notify users of temporary authentication issues
   - Provide alternative access if needed
   - Schedule maintenance window

3. **Monitor and Document**
   - Document rollback reason
   - Create incident report
   - Plan next iteration

### Emergency Procedures

**Database Lockout Recovery:**

If authentication fails completely and blocks all access:

1. Temporarily add a bypass route (DELETE in production after use)
2. Manually reset user sessions via Cloudant
3. Deploy hotfix authentication client-side

**IBM App ID Service Outage:**

If IBM App ID becomes unavailable:

1. Display maintenance message to users
2. Cache last validated tokens (emergency fallback)
3. Implement temporary guest mode with limited functionality

## Summary

This refactoring transforms the Story Narrator authentication from a vulnerable localStorage-based system to a secure HttpOnly cookie-based approach with refresh token support. The changes affect 15 files total: 3 deletions, 11+ modifications, and 1 new file creation. The step-by-step procedure provides a clear path forward, while the rollback plan ensures safety in case of critical issues.

**Estimated Timeline:**

- Phase 1-2 (Preparation + Library Creation): 1-2 hours
- Phase 3 (Component Updates): 1-2 hours
- Phase 4 (API Route Updates): 30 minutes
- Phase 5 (Testing): 2-3 hours
- **Total Estimated Time: 5-8 hours**