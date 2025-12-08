# Authentication & Onboarding Setup Guide

## Overview

We've implemented a complete authentication and onboarding system using **Clerk** for secure, modern authentication with support for multiple user roles: **Associates**, **Vendors**, and **Buyers**.

## 🎯 Features

### Authentication
- ✅ Email/Password authentication via Clerk
- ✅ Social login support (Google, GitHub, etc.)
- ✅ Secure session management
- ✅ Password reset functionality
- ✅ Email verification

### Onboarding Flow
- ✅ Role selection (Associate/Vendor/Buyer)
- ✅ Multi-step form with smooth transitions
- ✅ Progress tracking
- ✅ File uploads for profile pictures and portfolio
- ✅ Form validation
- ✅ Light-themed, modern UI

### Associate Onboarding (Completed)
1. **Personal Information**
   - Profile picture upload
   - Full name, email, phone
   - Location

2. **Professional Details**
   - Firm name
   - Current designation
   - Years of experience
   - Specializations (multi-select)
   - Professional bio

3. **Portfolio & Media**
   - Portfolio image/document uploads
   - Portfolio links (Behance, Dribbble, etc.)
   - Working drawings upload
   - Certifications

4. **Review & Submit**
   - Preview all entered information
   - Edit functionality

## 🚀 Setup Instructions

### 1. Install Dependencies

Already installed:
```bash
npm install @clerk/clerk-react
```

### 2. Get Clerk API Keys

1. Go to [Clerk Dashboard](https://dashboard.clerk.com/)
2. Create a new application (or use existing)
3. Copy your **Publishable Key** from the API Keys section

### 3. Configure Environment Variables

Create a `.env` file in the `client` directory:

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_actual_key_here
```

### 4. Update Clerk Dashboard Settings

In your Clerk Dashboard, configure:

**Paths:**
- Sign-in path: `/login`
- Sign-up path: `/register`
- After sign-in: `/`
- After sign-up: `/role-selection`

**Session:**
- Session lifetime: As per your requirements
- Multi-session: Enable if needed

**Appearance:**
The UI is customized in the components with Tailwind classes.

## 📁 File Structure

```
client/src/
├── providers/
│   └── ClerkProvider.jsx          # Clerk wrapper with configuration
├── pages/
│   ├── Login.jsx                  # Login page with Clerk SignIn
│   ├── Register.jsx               # Registration with Clerk SignUp
│   ├── RoleSelection.jsx          # Role selection screen
│   └── onboarding/
│       └── AssociateOnboarding.jsx # Associate onboarding flow
└── main.jsx                       # ClerkProvider integrated
```

## 🎨 UI Components

### Login & Register Pages
- Modern gradient backgrounds
- Responsive 2-column layout
- Smooth animations with Framer Motion
- Benefits showcase
- Integrated Clerk components with custom styling

### Role Selection
- Interactive card selection
- Animated hover effects
- Feature highlights for each role
- Visual feedback on selection

### Associate Onboarding
- 4-step wizard with progress bar
- Real-time validation
- File upload with preview
- Drag-and-drop support
- Mobile-responsive design
- Smooth page transitions

## 🔄 User Flow

```
1. User visits /register
   ↓
2. Signs up via Clerk (email or social)
   ↓
3. Redirected to /role-selection
   ↓
4. Selects role (Associate/Vendor/Buyer)
   ↓
5. Redirected to /onboarding/{role}
   ↓
6. Completes multi-step onboarding
   ↓
7. Redirected to appropriate portal/dashboard
```

## 🎯 Next Steps

### For Vendors (To Be Built)
- Similar onboarding flow
- Business details
- GSTIN/Tax information
- Product catalog setup
- Banking details

### For Buyers (To Be Built)
- Profile setup
- Project requirements
- Company information
- Preferences

## 🔧 Customization

### Clerk Appearance
Customize in each auth component:
```jsx
<SignIn
  appearance={{
    elements: {
      formButtonPrimary: "bg-blue-600 hover:bg-blue-700",
      // ... more customization
    }
  }}
/>
```

### Onboarding Steps
Modify steps in `AssociateOnboarding.jsx`:
```javascript
const steps = [
  { id: 1, title: "...", icon: User },
  // Add or remove steps
];
```

### Form Fields
Add/remove fields in the step component functions:
```jsx
function PersonalInfoStep({ formData, onChange }) {
  // Modify form fields here
}
```

## 🐛 Troubleshooting

### Clerk Not Loading
- Check if `VITE_CLERK_PUBLISHABLE_KEY` is set correctly
- Ensure the key starts with `pk_test_` or `pk_live_`
- Restart the dev server after adding env variables

### Redirects Not Working
- Verify paths in Clerk Dashboard match your routes
- Check `afterSignInUrl` and `afterSignUpUrl` props

### Styling Issues
- Ensure Tailwind CSS is properly configured
- Check if `tailwindcss-animate` is installed
- Verify framer-motion is working

## 📝 Notes

- Currently, Associate onboarding UI is complete
- Backend integration pending
- Vendor and Buyer onboarding UI to be built next
- All uploaded files are currently stored in local state only
- API integration needed for persistent storage

## 🎨 Design Principles

- **Light Theme**: Clean, professional appearance
- **Smooth Transitions**: Framer Motion for all animations
- **Mobile-First**: Responsive design throughout
- **Progressive Disclosure**: Show information step by step
- **Visual Feedback**: Clear indication of progress and status
- **Accessibility**: Proper labels, ARIA attributes, and keyboard navigation

## 🔐 Security Considerations

- Clerk handles all authentication security
- Session tokens are managed automatically
- No passwords stored locally
- Secure file upload implementation needed for production
- Environment variables never exposed to client

---

**Ready to test!** Visit `/register` to start the flow.
