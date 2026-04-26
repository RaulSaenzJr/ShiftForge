# Admin Code Setup

## For Administrators

### Default Admin Code

The default admin code is: **STAFFING2025**

You can change this in the backend `.env` file:

```bash

ADMIN_CODE=your-custom-code-here

```

### How It Works

1. **Registration Process**
   - Users register as **contractors** by default
   - They select which staff roles they're available for
   - Optional: If they have an admin code, they can enter it to become an admin

2. **Admin Code Field**
   - Hidden by default with a "+ Admin Access" button
   - Only appears during registration if user clicks the button
   - Password-protected so it's not visible in plain text

3. **Security**
   - If an invalid code is entered, registration fails with "Invalid admin code" message
   - Only users with the correct code can become admins
   - Change the code periodically in `.env` and restart the server

### Accessing Admin Features

**Requirements to become Admin:**

1. During registration, click "+ Admin Access"
2. Enter the correct admin code
3. Complete registration

Once an admin account is created, they can:

- Create events
- View calendar
- Review and approve shift applications
- Assign shifts directly to contractors
- Manage all staff

### To Change the Admin Code

1. Edit `/backend/.env`
2. Change `ADMIN_CODE=your-new-code`
3. Restart the backend server
4. New admin registrations will require the new code

### To Remove Admin Access (Future Enhancement)

Currently, admin status is permanent. To revoke admin access:

1. Delete the user from the database, or
2. Future enhancement: Add an admin panel to change user roles

---

**Tip:** Share the admin code with trusted staff members only via secure channels (not email/chat).
