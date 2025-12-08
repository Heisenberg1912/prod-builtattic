# Authentication Setup Guide

## Current Status

✅ **Clerk Authentication is ENABLED and working**

Your application is now properly configured to use Clerk for authentication.

## How to Use

### Creating and Testing Accounts

1. **Navigate to the app**: Open http://localhost:5175 in your browser

2. **Register a new account**:
   - Go to `/register` or click "Sign up"
   - Use the Clerk signup form
   - You can use:
     - Email + Password
     - Google Sign-In
     - Other OAuth providers configured in Clerk

3. **Login to existing account**:
   - Go to `/login` or click "Sign in"
   - Enter your credentials
   - You'll be redirected to the home page (or dashboard if you have a role)

4. **After Registration Flow**:
   - New users are redirected to `/role-selection`
   - Choose your role: Associate, Vendor, or Buyer
   - Complete the onboarding for your role
   - Access the appropriate dashboard

### Testing the Associate Flow

1. **Register** → Sign up at `/register`
2. **Select Role** → Choose "Associate" at `/role-selection`
3. **Onboarding** → Complete associate onboarding at `/onboarding/associate`
4. **Dashboard** → You'll be redirected to `/associates/dashboard`
5. **Create Content**:
   - **Design Plans**: `/associates/design-studio/create`
   - **Services**: `/associates/skill-studio/create`

## Configuration

### Current .env Setup

```bash
# Clerk Authentication (ENABLED)
VITE_CLERK_PUBLISHABLE_KEY=pk_test_Y2FzdWFsLXJheS04NS5jbGVyay5hY2NvdW50cy5kZXYk

# Offline mode (disabled - Clerk is active)
VITE_ENABLE_OFFLINE_ACCOUNTS=false
```

### Option 1: Use Clerk (Current Setup - Recommended)

**Pros:**
- Real authentication
- OAuth providers (Google, GitHub, etc.)
- User management dashboard
- Production-ready

**Setup:**
- Already configured ✅
- Just use the app!

### Option 2: Get Your Own Clerk Account (Optional)

If you want your own Clerk instance:

1. Go to https://dashboard.clerk.com/
2. Create a free account
3. Create a new application
4. Copy your Publishable Key
5. Update `client/.env`:
   ```bash
   VITE_CLERK_PUBLISHABLE_KEY=your_new_key_here
   ```
6. Restart the dev server

### Option 3: Offline Mode (For Local Testing Without Clerk)

If you want to test without Clerk at all:

1. Update `client/.env`:
   ```bash
   VITE_CLERK_PUBLISHABLE_KEY=
   VITE_ENABLE_OFFLINE_ACCOUNTS=true
   ```
2. Restart dev server
3. Login/Register pages will show configuration error
4. You can manually set auth in browser console:
   ```javascript
   localStorage.setItem('auth_token', 'demo-token');
   localStorage.setItem('role', 'associate');
   localStorage.setItem('user', JSON.stringify({
     id: 'demo-user-1',
     name: 'Demo User',
     email: 'demo@example.com'
   }));
   location.reload();
   ```

## Troubleshooting

### "Configuration Required" Error

**Problem**: You see a red error page saying Clerk is not configured

**Solution**:
1. Check `client/.env` has `VITE_CLERK_PUBLISHABLE_KEY=pk_test_...`
2. Restart the dev server: `cd client && npm run dev`
3. Clear browser cache and reload

### Can't Create New Account

**Problem**: Signup form not working

**Possible causes:**
1. **Network issue**: Check browser console for errors
2. **Invalid Clerk key**: The test key might have expired
   - Get a new key from https://dashboard.clerk.com/
3. **Browser extensions**: Disable ad blockers that might block Clerk

**Quick fix**: Try incognito/private browsing mode

### Lost Access to Existing Account

**Problem**: Can't login to previously created account

**Solution**:
1. **Password reset**: Use "Forgot password" on login page
2. **Different Clerk instance**: If the Clerk key changed, old accounts won't work
   - Create a new account with the new key
3. **Clear and start fresh**: Clear localStorage in browser DevTools

## File Locations

### Authentication Files

- **Main Config**: `client/.env`
- **Clerk Provider**: `client/src/providers/ClerkProvider.jsx`
- **Auth Service**: `client/src/services/auth.js`
- **Login Page**: `client/src/pages/Login.jsx`
- **Register Page**: `client/src/pages/Register.jsx`
- **Role Selection**: `client/src/pages/RoleSelection.jsx`

### Onboarding Pages

- **Associate**: `client/src/pages/onboarding/AssociateOnboarding.jsx`
- **Vendor**: `client/src/pages/onboarding/VendorOnboarding.jsx`
- **Buyer**: `client/src/pages/onboarding/BuyerOnboarding.jsx`

### Dashboard Pages

- **Associate Dashboard**: `client/src/pages/associates/AssociateDashboard.jsx`
- **Design Studio**: `client/src/pages/associates/design-studio/`
- **Skill Studio**: `client/src/pages/associates/skill-studio/`

## Quick Test Checklist

- [ ] Navigate to http://localhost:5175
- [ ] Click "Sign up" or go to `/register`
- [ ] Create account with email + password
- [ ] Verify email (if Clerk requires it)
- [ ] Login successfully
- [ ] See role selection page
- [ ] Choose "Associate" role
- [ ] Complete onboarding
- [ ] Land on Associate Dashboard
- [ ] Click "Add Design Plan"
- [ ] Fill form and save as draft
- [ ] See design in dashboard
- [ ] Publish the design
- [ ] Repeat for services

## Development Server

**Current Status**: Running on http://localhost:5175

**To restart**:
```bash
cd client
npm run dev
```

**To stop**:
- Press `Ctrl+C` in the terminal
- Or close the terminal window

## Next Steps

1. **Test the full flow** using the checklist above
2. **Create sample content** in both Design Studio and Skill Studio
3. **Verify localStorage** is persisting your data
4. **Check the dashboard** shows your creations correctly

---

**Need help?** Check the browser console (F12) for error messages.
