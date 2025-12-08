# 📢 Registration Banner Component Guide

## Overview

The `RegistrationBanner` component is a reusable, customizable top banner for showing registration status messages on your auth pages.

**File:** [client/src/components/RegistrationBanner.jsx](client/src/components/RegistrationBanner.jsx)

---

## 🎨 Banner Variations

### 1. **Registration Open** (Default - Green)
```jsx
<RegistrationBanner
  status="open"
  linkText="Sign in"
  linkTo="/login"
/>
```
**Preview:**
- **Color:** Green gradient (emerald-600 to emerald-600)
- **Icon:** CheckCircle ✓
- **Message:** "New registrations are currently open! Join our growing community."
- **Use When:** Accepting new registrations

---

### 2. **Registration Closed** (Dark/Slate)
```jsx
<RegistrationBanner
  status="closed"
  linkText="Sign in"
  linkTo="/login"
/>
```
**Preview:**
- **Color:** Dark gradient (slate-800 to slate-900)
- **Icon:** AlertCircle !
- **Message:** "New registrations are currently closed. Existing members can continue below."
- **Use When:** Not accepting new registrations

---

### 3. **Limited Registration** (Orange/Amber)
```jsx
<RegistrationBanner
  status="limited"
  message="Only 50 spots left for Associate members! Register now."
  dismissible={true}
/>
```
**Preview:**
- **Color:** Amber gradient (amber-600 to orange-600)
- **Icon:** Info (i)
- **Message:** Custom or "Limited spots available! Register now to secure your place."
- **Use When:** Limited availability, urgency

---

### 4. **Info Banner** (Blue)
```jsx
<RegistrationBanner
  status="info"
  message="Early access registration now open for verified professionals!"
  linkText="Learn more"
  linkTo="/about"
/>
```
**Preview:**
- **Color:** Blue gradient (blue-600 to indigo-600)
- **Icon:** Info (i)
- **Message:** Custom message
- **Use When:** General information, announcements

---

## 🔧 Props API

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `status` | `"open"` \| `"closed"` \| `"limited"` \| `"info"` | `"open"` | Banner style variant |
| `message` | `string` | Auto (based on status) | Custom message text |
| `linkText` | `string` | `"Sign in"` | Text for the link |
| `linkTo` | `string` | `"/login"` | URL for the link |
| `dismissible` | `boolean` | `false` | Show dismiss (X) button |

---

## 📋 Usage Examples

### Example 1: Simple Open Registration
```jsx
<RegistrationBanner status="open" />
```

### Example 2: Closed with Custom Link
```jsx
<RegistrationBanner
  status="closed"
  linkText="Contact support"
  linkTo="/support"
/>
```

### Example 3: Limited Spots with Dismiss
```jsx
<RegistrationBanner
  status="limited"
  message="Only 25 spots remaining! Early bird pricing ends in 48 hours."
  dismissible={true}
/>
```

### Example 4: Promotional Banner
```jsx
<RegistrationBanner
  status="info"
  message="🎉 Special offer: First 100 Associates get premium features free for 6 months!"
  linkText="View details"
  linkTo="/promo"
  dismissible={true}
/>
```

### Example 5: No Link
```jsx
<RegistrationBanner
  status="limited"
  message="Registration will reopen on January 1st, 2025."
  linkText=""
  linkTo=""
/>
```

---

## 🎨 Visual Styles

### Color Schemes

**Open (Green):**
```css
background: linear-gradient(to right, #059669, #10b981)
icon-color: #bbf7d0 (green-200)
```

**Closed (Dark):**
```css
background: linear-gradient(to right, #1e293b, #0f172a)
icon-color: #cbd5e1 (slate-300)
```

**Limited (Orange):**
```css
background: linear-gradient(to right, #d97706, #ea580c)
icon-color: #fed7aa (amber-200)
```

**Info (Blue):**
```css
background: linear-gradient(to right, #2563eb, #4f46e5)
icon-color: #bfdbfe (blue-200)
```

---

## 📱 Responsive Design

- **Mobile (<640px):** Icon hidden, text centered, smaller font
- **Tablet (640px+):** Icon visible, full layout
- **Desktop:** Optimized spacing and typography

---

## ♿ Accessibility

- ✅ ARIA label on dismiss button
- ✅ Keyboard accessible links
- ✅ High contrast text
- ✅ Screen reader friendly

---

## 🔄 State Management

The banner includes built-in dismiss functionality:

```jsx
const [isDismissed, setIsDismissed] = React.useState(false);

if (isDismissed) return null;
```

**Note:** Dismiss state is component-local only. For persistent dismissal across page loads, you'd need to add localStorage:

```jsx
const [isDismissed, setIsDismissed] = React.useState(() => {
  return localStorage.getItem('bannerDismissed') === 'true';
});

const handleDismiss = () => {
  localStorage.setItem('bannerDismissed', 'true');
  setIsDismissed(true);
};
```

---

## 🎯 When to Use Each Type

### Registration Open (Green)
- ✅ New user sign-ups welcome
- ✅ General availability
- ✅ Positive messaging

### Registration Closed (Dark)
- ✅ Temporarily not accepting registrations
- ✅ Maintenance period
- ✅ Invite-only phase

### Limited Registration (Orange)
- ✅ Scarcity marketing
- ✅ Early bird offers
- ✅ Limited spots/time
- ✅ Create urgency

### Info Banner (Blue)
- ✅ Announcements
- ✅ New features
- ✅ Updates
- ✅ General information

---

## 💡 Pro Tips

### 1. **Use Emojis for Impact**
```jsx
<RegistrationBanner
  status="limited"
  message="🔥 Only 10 spots left! Register in the next hour for 50% off."
/>
```

### 2. **Add Countdown Timer** (External Integration)
```jsx
<RegistrationBanner
  status="limited"
  message={`⏰ Registration closes in ${timeRemaining}. Don't miss out!`}
/>
```

### 3. **A/B Testing Different Messages**
```jsx
const messages = [
  "Join 10,000+ professionals on BuildAttic!",
  "Start your free trial today - no credit card required!",
  "Limited time: Get 3 months free with annual plan!"
];

<RegistrationBanner
  status="info"
  message={messages[Math.floor(Math.random() * messages.length)]}
/>
```

### 4. **Seasonal Messages**
```jsx
const getSeasonalMessage = () => {
  const month = new Date().getMonth();
  if (month === 11) return "🎄 Holiday special: Join before Dec 31 for exclusive perks!";
  if (month === 0) return "🎉 New Year offer: Start fresh with BuildAttic!";
  return "Registration now open!";
};

<RegistrationBanner
  status="limited"
  message={getSeasonalMessage()}
/>
```

---

## 🔧 Customization

### Change Colors
Edit the `configs` object in `RegistrationBanner.jsx`:

```jsx
const configs = {
  open: {
    bg: "bg-gradient-to-r from-green-600 to-emerald-600", // Change colors
    icon: CheckCircle,
    defaultMessage: "Your custom message here",
    iconColor: "text-green-200"
  },
  // ... other configs
};
```

### Add New Status Type
```jsx
const configs = {
  // ... existing configs
  premium: {
    bg: "bg-gradient-to-r from-yellow-500 to-amber-500",
    icon: Crown, // Import from lucide-react
    defaultMessage: "Premium registration now open!",
    iconColor: "text-yellow-200"
  }
};
```

---

## 📦 Where It's Used

Currently implemented in:
- [Register.jsx](client/src/pages/Register.jsx) - Line 26

Can also be used in:
- Login page
- Role selection page
- Any auth-related pages

---

## 🚀 Quick Start

1. **Import the component:**
```jsx
import RegistrationBanner from "../components/RegistrationBanner";
```

2. **Add to your page:**
```jsx
<RegistrationBanner status="open" />
```

3. **Customize as needed:**
```jsx
<RegistrationBanner
  status="limited"
  message="Your custom message"
  linkText="Click here"
  linkTo="/page"
  dismissible={true}
/>
```

---

## 📸 Screenshots

Visit these URLs to see the banner in action:
- **Registration Page:** http://localhost:5175/register
- **Login Page:** http://localhost:5175/login (if added)

---

## 🎨 Design Tokens

```css
/* Spacing */
padding: 0.75rem 1rem (py-3 px-4)

/* Typography */
font-size: 0.875rem (text-sm) mobile
font-size: 1rem (text-base) desktop

/* Border Radius */
dismiss-button: 0.5rem (rounded-lg)

/* Icons */
size: 1.25rem (h-5 w-5)
```

---

## ✅ Best Practices

1. **Keep messages concise** - One clear message per banner
2. **Use appropriate status** - Match the status to your message tone
3. **Test on mobile** - Ensure readability on small screens
4. **Don't overuse dismissible** - Only for non-critical messages
5. **Update regularly** - Keep messages fresh and relevant

---

**Happy messaging! 🎉**
