# 🎨 Onboarding UI Visual Guide

## User Journey Overview

```
┌─────────────────┐
│   Register      │  ← Clerk authentication with smooth animations
│   /register     │     - Email/Password or Social login
└────────┬────────┘     - Custom styled Clerk component
         │
         ↓
┌─────────────────┐
│ Role Selection  │  ← Choose user type with animated cards
│ /role-selection │     - Associate (Architects & Designers)
└────────┬────────┘     - Vendor (Material Suppliers)
         │              - Buyer (Clients & Firms)
         ↓
┌─────────────────────────────────────────────┐
│    Associate Onboarding (4 Steps)          │
│    /onboarding/associate                   │
├─────────────────────────────────────────────┤
│ Step 1: Personal Information               │
│  ├─ Profile Picture Upload                 │
│  ├─ Full Name                              │
│  ├─ Email & Phone                          │
│  └─ Location                               │
├─────────────────────────────────────────────┤
│ Step 2: Professional Details               │
│  ├─ Firm Name                              │
│  ├─ Designation                            │
│  ├─ Years of Experience                    │
│  ├─ Specializations (Multi-select)         │
│  └─ Professional Bio                       │
├─────────────────────────────────────────────┤
│ Step 3: Portfolio & Media                  │
│  ├─ Portfolio Files Upload                 │
│  ├─ Portfolio Links (Multiple)             │
│  ├─ Working Drawings                       │
│  └─ Certifications                         │
├─────────────────────────────────────────────┤
│ Step 4: Review & Submit                    │
│  ├─ Preview All Information                │
│  ├─ Confirm Details                        │
│  └─ Submit (with loading state)            │
└────────┬────────────────────────────────────┘
         │
         ↓
┌─────────────────┐
│ Associate Portal│  ← Redirected to user dashboard
│ /associates/...  │
└─────────────────┘
```

## 📱 Pages Description

### 1. Register Page (`/register`)
**Layout:** 2-column responsive layout

**Left Column:**
- Clerk SignUp component
- Custom styled with Tailwind
- Social login buttons
- Email/password form

**Right Column:**
- "What's Next?" card with gradient background
- Role benefits preview (Associate, Vendor, Buyer)
- Security & speed badge
- Link to login page

**Animations:**
- Fade in from top (header)
- Slide in from left (form)
- Slide in from right (benefits)
- Staggered benefit cards

---

### 2. Login Page (`/login`)
**Layout:** 2-column responsive layout

**Left Column:**
- Clerk SignIn component
- Custom styled with purple gradient theme
- Social login buttons
- Email/password form
- "Forgot password?" link

**Right Column:**
- "Why BuildAttic?" card
- 5 key benefits with checkmarks
- Statistics showcase (10,000+ users)
- Split stats for Associates/Vendors/Buyers

**Animations:**
- Fade in from top (header)
- Slide in from left (form)
- Slide in from right (benefits)
- Staggered benefit list items

---

### 3. Role Selection (`/role-selection`)
**Layout:** 3-column grid (responsive to 1 column on mobile)

**Header:**
- Gradient badge with sparkle icon
- Large title: "Choose Your Role"
- Subtitle with description

**Role Cards:**
Each card contains:
- Icon with gradient background
- Role title & subtitle
- Description
- 4 feature bullet points with checkmarks
- Selection indicator (animated checkmark)

**Interaction:**
- Hover effects (scale, border highlight)
- Click to select
- Selected state with border and scale
- Animated checkmark appears on selection

**Button:**
- "Continue as {role}" button appears when role selected
- Gradient background
- Arrow icon
- Smooth fade-in animation

**Colors:**
- Associate: Blue gradient (from-blue-500 to-cyan-500)
- Vendor: Purple-pink gradient (from-purple-500 to-pink-500)
- Buyer: Green gradient (from-emerald-500 to-teal-500)

---

### 4. Associate Onboarding (`/onboarding/associate`)

#### Header Section
- Gradient badge: "Associate Onboarding"
- Step title (changes per step)
- Step subtitle

#### Progress Bar
- 4 circular step indicators
- Icons for each step (User, Briefcase, Image, FileText)
- Active step highlighted in blue
- Completed steps show checkmark in green
- Connected by progress lines that fill on completion

---

#### **Step 1: Personal Information**

**Profile Picture Section:**
- Large circular preview (32x32)
- Default user icon if no image
- Upload button overlay
- Preview image after upload

**Form Fields:**
- Full Name (required) - text input
- Email Address (required) - email input
- Phone Number (required) - tel input
- Location (optional) - text input

**Grid Layout:** 2 columns on desktop, 1 on mobile

---

#### **Step 2: Professional Details**

**Form Fields:**
- Firm/Company Name (required)
- Current Designation (required)
- Years of Experience (number input)

**Specializations Section:**
- Multi-select chip interface
- 8 specialization options in 3-column grid:
  - Architecture Design
  - Interior Design
  - Landscape Design
  - 3D Visualization
  - Project Management
  - Structural Design
  - MEP Design
  - Urban Planning

**Selected State:**
- Blue border and background
- Scale animation on click

**Bio Section:**
- Large textarea (5 rows)
- Placeholder with guidance

---

#### **Step 3: Portfolio & Media**

**Portfolio Files Upload:**
- Drag & drop zone with dashed border
- Upload icon and instructions
- Accepts: Images, PDFs
- Preview grid (3 columns)
- Remove button on hover
- File name display

**Portfolio Links:**
- Dynamic list of URL inputs
- "Add Another Link" button
- Remove button for each link
- Supports Behance, Dribbble, etc.

**Working Drawings:**
- Secondary upload zone
- Accepts: .dwg, .dxf, .pdf
- List view with file details
- File size display
- Remove buttons

---

#### **Step 4: Review & Submit**

**Profile Header:**
- Large profile picture (24x24 circular)
- Full name
- Designation & firm name

**Information Sections:**
- Contact Information card
- Professional Details card
- Bio display (if provided)
- Portfolio summary card

**Note Banner:**
- Blue background
- Info about editing later

---

#### Navigation
**Bottom Navigation Bar:**
- "Previous" button (left)
  - Disabled on first step
  - Outline style
- "Next" button (right)
  - Blue gradient
  - Changes to "Complete Setup" on last step
  - Different icon (Arrow vs Check)

---

## 🎨 Design System

### Color Palette

**Primary Colors:**
- Blue: `#3B82F6` (Associate theme)
- Purple: `#A855F7` (Vendor theme)
- Emerald: `#10B981` (Buyer theme)

**Gradients:**
```css
/* Associates */
from-blue-500 to-cyan-500

/* Vendors */
from-purple-500 to-pink-500

/* Buyers */
from-emerald-500 to-teal-500
```

**Neutrals:**
- Slate-900: Primary text
- Slate-600: Secondary text
- Slate-200: Borders
- Slate-50: Light backgrounds

**Status Colors:**
- Green-500: Success, completed
- Red-500: Error, remove
- Blue-500: Active, selected

---

### Typography

**Headings:**
- H1: 4xl-5xl, font-bold (Main titles)
- H2: 2xl-3xl, font-bold (Section titles)
- H3: xl, font-semibold (Card titles)

**Body:**
- Base: text-sm to text-base
- Small: text-xs
- Colors: slate-900 (primary), slate-600 (secondary)

---

### Spacing

**Containers:**
- Max width: 4xl-7xl depending on page
- Padding: px-4 (mobile), px-8 (desktop)
- Gaps: 4-8 units between sections

**Cards:**
- Padding: p-6 to p-8
- Border radius: rounded-lg to rounded-3xl
- Shadow: shadow-xl for elevation

---

### Animations

**Page Transitions:**
```javascript
initial={{ opacity: 0, x: 20 }}
animate={{ opacity: 1, x: 0 }}
exit={{ opacity: 0, x: -20 }}
transition={{ duration: 0.3 }}
```

**Hover Effects:**
```javascript
whileHover={{ scale: 1.05 }}
whileTap={{ scale: 0.95 }}
```

**Staggered Animations:**
```javascript
transition={{ delay: 0.4 + index * 0.1 }}
```

---

## 📐 Responsive Breakpoints

**Mobile (<768px):**
- Single column layouts
- Stacked cards
- Full-width buttons
- Simplified progress indicators

**Tablet (768px - 1024px):**
- 2-column grids
- Side-by-side navigation
- Medium card sizes

**Desktop (>1024px):**
- 3-column grids
- Wide layouts with max-width constraints
- Large card displays

---

## ✨ Interactive Elements

### Buttons

**Primary:**
- Blue/Purple gradient background
- White text
- Hover: Darker gradient
- Padding: px-6 to px-8, py-2 to py-6

**Secondary:**
- White background
- Border: border-slate-200
- Hover: border-slate-300

**Icon Buttons:**
- Circular or square
- Icon only
- Hover effects

### Inputs

**Text Inputs:**
- Border: border-slate-300
- Focus: border-blue-500, ring
- Padding: px-4 py-2
- Rounded: rounded-lg

**File Inputs:**
- Hidden native input
- Custom styled dropzone
- Visual feedback on hover

### Cards

**Standard:**
- White background
- Border: border-slate-200
- Shadow: shadow-xl
- Rounded: rounded-lg

**Gradient:**
- Gradient backgrounds for special sections
- Lighter borders matching gradient

---

## 🔄 State Management

### Form Data Structure

```javascript
{
  // Step 1
  profilePicture: File | null,
  profilePicturePreview: string | null,
  fullName: string,
  email: string,
  phone: string,
  location: string,

  // Step 2
  firmName: string,
  designation: string,
  experience: number,
  specialization: string[],
  bio: string,

  // Step 3
  portfolioFiles: Array<{file, preview, name, size}>,
  portfolioLinks: string[],
  workingDrawings: Array<{file, preview, name, size}>,
  certifications: Array<{file, preview, name, size}>
}
```

### Validation Rules

**Step 1:**
- fullName: required, min 2 chars
- email: required, valid email
- phone: required

**Step 2:**
- firmName: required
- designation: required
- specialization: at least 1 selected

**Step 3:**
- No required fields (optional step)

---

## 🚀 Performance Optimizations

1. **Lazy Loading:** Images loaded progressively
2. **Debounced Inputs:** For text inputs with validation
3. **Optimized Animations:** GPU-accelerated transforms
4. **Code Splitting:** Route-based splitting
5. **Memoization:** Expensive computations cached

---

## 📱 Mobile Considerations

1. **Touch-friendly:** Larger tap targets (min 44x44px)
2. **Swipe gestures:** Considered but not implemented yet
3. **Viewport optimization:** Proper meta viewport tag
4. **Keyboard handling:** Smooth scroll on input focus
5. **File uploads:** Native mobile file pickers work seamlessly

---

## 🎯 Accessibility

1. **ARIA labels:** All interactive elements labeled
2. **Keyboard navigation:** Full support
3. **Focus indicators:** Visible focus rings
4. **Screen reader support:** Semantic HTML
5. **Color contrast:** WCAG AA compliant
6. **Form validation:** Clear error messages

---

## 🧪 Testing Checklist

- [ ] Register with email
- [ ] Register with social login
- [ ] Select each role type
- [ ] Complete all onboarding steps
- [ ] Upload different file types
- [ ] Test form validation
- [ ] Test on mobile device
- [ ] Test with screen reader
- [ ] Test keyboard navigation
- [ ] Test with slow network

---

## 📊 Components Used

### From shadcn/ui:
- Card, CardContent, CardHeader, CardTitle, CardDescription
- Button
- Input
- Textarea
- Label
- Separator

### From lucide-react:
- Sparkles, CheckCircle, ArrowRight, ArrowLeft
- User, Briefcase, ImageIcon, FileText
- Building2, Package, ShoppingBag
- Upload, X, Check, Circle

### From framer-motion:
- motion
- AnimatePresence

### From @clerk/clerk-react:
- SignIn, SignUp
- useUser, ClerkProvider

---

**🎉 The UI is complete and ready for testing!**

Visit http://localhost:5176 to see it in action.
