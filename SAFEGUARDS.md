# Staff Management Safeguards

## Overview
This document describes the safety features and administrative controls for managing staff accounts in the Staffing APP.

## Implemented Safeguards

### 1. Duplicate Prevention

#### Email Uniqueness
- **Enforcement**: Database-level unique constraint on `email` field
- **Validation**: Backend checks before user creation
- **User Feedback**: Clear error message "User already exists"
- **Applies To**: All user registrations and admin-created accounts

#### Phone Number Uniqueness
- **Enforcement**: Database-level unique sparse index on `phone` field
- **Validation**: Backend checks if phone is provided
- **User Feedback**: Clear error message "Phone number already in use"
- **Applies To**: All user registrations and admin-created accounts
- **Special Note**: Sparse index allows multiple null/empty phone numbers

**Implementation Details:**
```javascript
// User.js model
phone: {
  type: String,
  sparse: true,  // Allows null values
  unique: true   // Enforces uniqueness when value exists
}
```

**Error Handling:**
- Registration fails gracefully with clear error message
- Form validation prevents submission of duplicate data
- Existing users are not affected

### 2. User Deletion (Admin Only)

#### Feature Description
Administrators can permanently delete any user account regardless of role (admin or contractor).

#### Safety Mechanisms

**Confirmation Dialog:**
```
Are you sure you want to delete [User Name]?

This action cannot be undone. All associated data will be permanently removed.
```

**Self-Protection:**
- Admins **cannot** delete their own account
- Backend validates: `userId !== currentAdminId`
- Error message: "Cannot delete your own account"

**Access Control:**
- Endpoint: `DELETE /auth/user/:id`
- Middleware: `[auth, requireAdmin]`
- Only authenticated admins can access

**What Gets Deleted:**
- User account record
- All associated profile data
- Note: Applications/assignments remain in database (orphaned but traceable)

**Frontend Implementation:**
- Red "🗑️ Delete" button on each staff card
- Prominent warning in confirmation dialog
- Success/error feedback messages
- Automatic refresh of staff directory after deletion

#### Use Cases
- Remove test accounts
- Delete terminated employees
- Clean up duplicate accounts (after consolidating data)
- Remove inactive contractors

### 3. Password Reset (Admin Only)

#### Feature Description
Administrators can reset any user's password to a temporary system-generated password.

#### Safety Mechanisms

**Confirmation Dialog:**
```
Reset password for [User Name]?

A temporary password will be generated. Make sure to save it and provide it to the user.
```

**Password Generation:**
- Format: `Temp` + 8 random alphanumeric characters
- Example: `Tempx9k2m4p7`
- Automatically hashed with bcrypt before storage
- Cryptographically secure random generation

**Password Delivery:**
After successful reset, admin sees a detailed alert:
```
Password Reset Successful!

User: John Doe (john.doe@example.com)
Temporary Password: Tempx9k2m4p7

IMPORTANT: Save this password now! The user should change it after logging in.
```

**Access Control:**
- Endpoint: `POST /auth/reset-password/:id`
- Middleware: `[auth, requireAdmin]`
- Only authenticated admins can access

**Frontend Implementation:**
- Orange "🔑 Reset Password" button on each staff card
- Warning in confirmation dialog
- Alert window displays temporary password
- Blue info banner confirms reset
- Admin must manually provide password to user

#### Use Cases
- User forgot password
- Account lockout situations
- Security breach response
- Onboarding new employees (if initial password lost)

### 4. Duplicate Detection Strategy

#### Why Duplicates Matter
- **Email**: Primary login identifier - must be unique
- **Phone**: Contact method - prevents confusion and data integrity issues
- **Impact**: Prevents split identity, ensures notifications reach correct user

#### Detection Levels

**1. Database Level (Primary)**
- Unique constraints on email and phone fields
- Enforced by MongoDB
- Fastest detection (happens at data layer)
- Cannot be bypassed

**2. Backend Validation (Secondary)**
- Explicit checks before user creation
- Custom error messages
- Applies to both registration and admin creation

**3. Frontend Validation (Tertiary - Future Enhancement)**
- Real-time email/phone availability checking
- Visual feedback as user types
- Not yet implemented (future enhancement)

#### Edge Cases Handled

**Case 1: Null Phone Numbers**
- Multiple users can have no phone number
- Sparse index allows null values
- Only enforces uniqueness for provided values

**Case 2: Email Case Sensitivity**
- All emails converted to lowercase before storage
- `john.doe@example.com` = `JOHN.DOE@example.com`
- Prevents case-based duplicates

**Case 3: Phone Formatting**
- Currently stored as-is
- Future: Consider normalizing format (555-0100 vs 5550100)

**Case 4: Deleted Users**
- Email/phone freed up after user deletion
- Can be reused for new accounts
- No "soft delete" that blocks reuse

## UI/UX Design

### Staff Card Actions Layout

Each staff card now displays action buttons in this order:
1. **Assign to Event** (contractors only, if callback provided) - Blue
2. **🔑 Reset Password** - Orange/Warning
3. **🗑️ Delete** - Red/Danger

**Visual Hierarchy:**
- Positive actions (assign) - top
- Caution actions (reset) - middle  
- Destructive actions (delete) - bottom
- Color coding reinforces severity

### Feedback Messages

**Action Message Types:**

**Success (Green):**
- "User deleted successfully"
- "Password reset successfully for [Name]"
- "User created successfully"

**Error (Red):**
- "Failed to delete user"
- "Failed to reset password"
- "User already exists"
- "Phone number already in use"

**Info (Blue):**
- "Password reset successfully for [Name]"
- Displayed alongside the detailed password alert

**Duration:**
- Auto-dismiss after 5 seconds
- User can continue working while visible
- Smooth slide-in animation

## API Endpoints

### DELETE /auth/user/:id
**Purpose:** Permanently delete a user account

**Access:** Admin only

**Parameters:**
- `id` (URL param) - User ID to delete

**Request:**
```http
DELETE /auth/user/507f1f77bcf86cd799439011
Authorization: Bearer <admin-token>
```

**Success Response (200):**
```json
{
  "message": "User deleted successfully"
}
```

**Error Responses:**
- 404: User not found
- 400: Cannot delete your own account
- 401: Unauthorized (not logged in)
- 403: Forbidden (not admin)

### POST /auth/reset-password/:id
**Purpose:** Reset user password to temporary value

**Access:** Admin only

**Parameters:**
- `id` (URL param) - User ID to reset

**Request:**
```http
POST /auth/reset-password/507f1f77bcf86cd799439011
Authorization: Bearer <admin-token>
```

**Success Response (200):**
```json
{
  "message": "Password reset successfully",
  "tempPassword": "Tempx9k2m4p7",
  "userId": "507f1f77bcf86cd799439011",
  "userEmail": "john.doe@example.com"
}
```

**Error Responses:**
- 404: User not found
- 401: Unauthorized (not logged in)
- 403: Forbidden (not admin)

## Security Considerations

### Password Reset Security

**Strengths:**
✅ Temporary passwords are cryptographically random  
✅ Passwords hashed immediately (never stored plain text)  
✅ Admin-only access (requires authentication + authorization)  
✅ User is immediately notified (admin must tell them)  
✅ Detailed audit trail via action messages  

**Potential Improvements (Future):**
- Email temporary password directly to user
- Require password change on next login
- Set expiration time on temporary passwords
- Log all password resets in audit table

### Deletion Security

**Strengths:**
✅ Double confirmation (dialog + explicit action)  
✅ Cannot delete own account (prevents lockout)  
✅ Admin-only access  
✅ Clear warning about permanence  
✅ Immediate feedback on success/failure  

**Potential Improvements (Future):**
- Soft delete with recovery period (30 days)
- Require reason for deletion
- Cascade delete related records (applications, assignments)
- Archive user data before deletion
- Super-admin approval for admin deletions

### Duplicate Prevention Security

**Strengths:**
✅ Database-level enforcement (cannot be bypassed)  
✅ Multiple validation layers (DB, backend, frontend)  
✅ Case-insensitive email matching  
✅ Graceful error handling  

**Potential Improvements (Future):**
- Email verification before account activation
- Phone number verification (SMS code)
- Domain validation for email addresses
- International phone number formatting

## Testing Guide

### Test Case 1: Duplicate Email Prevention

1. Create user with email: test@example.com
2. Try to create another user with test@example.com
3. **Expected**: Error "User already exists"
4. Try with TEST@EXAMPLE.COM (uppercase)
5. **Expected**: Error "User already exists" (case insensitive)

### Test Case 2: Duplicate Phone Prevention

1. Create user with phone: 555-0100
2. Try to create another user with phone: 555-0100
3. **Expected**: Error "Phone number already in use"
4. Create user with NO phone number
5. Create another user with NO phone number
6. **Expected**: Both succeed (null values allowed)

### Test Case 3: Delete User

1. Login as admin
2. Go to Staff Directory
3. Click "🗑️ Delete" on a test user
4. Confirm deletion in dialog
5. **Expected**: Success message, user removed from list
6. Try to login as deleted user
7. **Expected**: "Invalid credentials"

### Test Case 4: Cannot Delete Self

1. Login as admin (admin@example.com)
2. Find yourself in Staff Directory
3. Click "🗑️ Delete" on your own card
4. Confirm deletion
5. **Expected**: Error "Cannot delete your own account"

### Test Case 5: Reset Password

1. Login as admin
2. Go to Staff Directory
3. Click "🔑 Reset Password" on a contractor
4. Confirm reset
5. **Expected**: Alert showing temporary password (e.g., Tempx9k2m4p7)
6. Copy the temporary password
7. Logout and login as that contractor using temp password
8. **Expected**: Login succeeds

### Test Case 6: Multiple Actions

1. Create test user "Jane Doe"
2. Reset Jane's password
3. Save temporary password
4. Delete Jane's account
5. Try to login with Jane's email and temp password
6. **Expected**: "Invalid credentials" (account deleted)

## Best Practices for Admins

### When to Delete a User
✅ Test accounts no longer needed  
✅ Duplicate accounts (after data consolidation)  
✅ Terminated employees (after final payroll)  
✅ Fraudulent/spam accounts  

❌ User forgot password (use reset instead)  
❌ Temporary suspension (future: add disable/enable feature)  
❌ User requested data deletion (future: add GDPR export first)  

### When to Reset Password
✅ User forgot password and cannot recover  
✅ User locked out after multiple failed attempts  
✅ Security breach suspected  
✅ New employee needs access (if initial password lost)  

❌ Regular password updates (users should change own password)  
❌ Proactive security (future: add forced password change policy)  

### Password Reset Workflow
1. Click "Reset Password" on user card
2. Confirm action in dialog
3. **Immediately copy** temporary password from alert
4. Paste into secure location (password manager, secure note)
5. Contact user via phone/email
6. Provide temporary password verbally or via secure channel
7. Instruct user to change password after login

### Handling Duplicate Phone Numbers
1. Identify which account is correct/primary
2. If other account needed, change phone in one account
3. If other account not needed, delete duplicate
4. Update contact records to use primary account

## Audit and Compliance

### What's Logged (Current)
- User creation timestamp
- Success/error messages displayed to admin
- Browser console errors

### What Should Be Logged (Future Enhancement)
- All password resets (who, when, target user)
- All user deletions (who, when, target user, reason)
- Failed deletion attempts (self-deletion, unauthorized)
- Duplicate prevention triggers (email/phone conflicts)

### GDPR Considerations (Future)

- Right to erasure: Delete function covers this
- Right to access: Need export functionality
- Right to rectification: Need edit user functionality
- Consent tracking: Not yet implemented

## Troubleshooting

### Problem: Cannot create user - "User already exists"
**Cause:** Email already in database  
**Solution:** 
1. Search staff directory for email
2. If found: Use existing account or delete duplicate
3. If not found: User may have been deleted, try different email

### Problem: Cannot create user - "Phone number already in use"
**Cause:** Phone number already assigned to another user  
**Solution:**
1. Search staff directory for phone number
2. Remove phone from other account or use different number
3. Or create user without phone, add later

### Problem: Delete button doesn't work on my account
**Cause:** Cannot delete your own account (safety feature)  
**Solution:** 
1. Have another admin delete your account
2. Or create new admin account first, then delete old one

### Problem: Temporary password not working
**Cause:** Password copied incorrectly or user account issues  
**Solution:**
1. Verify password was copied exactly (case-sensitive)
2. Check if user account still exists (wasn't deleted)
3. Reset password again to generate new temp password

### Problem: User deleted accidentally
**Cause:** Admin confirmed deletion dialog  
**Solution:**
1. No recovery possible (permanent deletion)
2. Create new account for user
3. Reassign any orphaned applications manually
4. Future: Implement soft delete with 30-day recovery

## Future Enhancements

### Planned Features
1. **Soft Delete**: 30-day recovery period before permanent deletion
2. **Audit Log**: Track all admin actions with timestamps
3. **Edit User**: Allow admins to update user details without deletion
4. **Disable/Enable**: Temporarily suspend accounts without deletion
5. **Bulk Actions**: Delete/reset multiple users at once
6. **Email Integration**: Auto-send temporary passwords via email
7. **Password Policies**: Force change on first login, expiration
8. **Role Management**: More granular permission system
9. **User Export**: CSV/JSON export of all user data (GDPR)
10. **Recovery Codes**: Alternative to password reset

### Security Improvements
1. **Two-Factor Authentication**: For admin accounts
2. **IP Whitelisting**: Restrict admin access to known IPs
3. **Session Timeout**: Auto-logout after inactivity
4. **Password Strength**: Enforce complexity requirements
5. **Rate Limiting**: Prevent brute force on password resets

---

## Summary

The staffing app now includes robust safeguards for managing user accounts:

✅ **Duplicate Prevention**: Email and phone uniqueness enforced  
✅ **User Deletion**: Admin can remove any account with safety checks  
✅ **Password Reset**: Generate secure temporary passwords  
✅ **Safety Confirmations**: All destructive actions require confirmation  
✅ **Clear Feedback**: Success/error messages guide admins  
✅ **Access Control**: All actions restricted to admin role  

These features provide essential administrative controls while maintaining safety and user experience.
