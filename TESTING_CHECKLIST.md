# ✅ Associate Platform - Testing Checklist

Use this checklist to test all features systematically.

---

## 🎯 Pre-Test Setup

- [ ] Dev server is running: `cd client && npm run dev`
- [ ] Browser is open at: `http://localhost:5175`
- [ ] Browser DevTools Console is open (F12)
- [ ] No console errors on page load

---

## 1️⃣ Dashboard Testing (`/associates/dashboard`)

### Profile Completion
- [ ] Shows completion percentage
- [ ] Progress bar animates
- [ ] Lists missing items (if profile incomplete)
- [ ] "Complete Now" button works

### Stats Cards
- [ ] Total Views displays a number
- [ ] Published Items count is correct
- [ ] Saves count shows
- [ ] Inquiries count shows
- [ ] Trend indicators show (+/- %)
- [ ] Icons display correctly
- [ ] Hover animation works

### Quick Actions
- [ ] "Add Design Plan" → navigates to `/associates/design-studio/create`
- [ ] "Add Service" → navigates to `/associates/skill-studio/create`
- [ ] "View Inquiries" → navigates to `/associates/inquiries`
- [ ] "View Analytics" → navigates to `/associates/analytics`
- [ ] Unread badge shows on Inquiries card

### Overview Panels
- [ ] Design Plans panel shows correct counts
- [ ] Services panel shows correct counts
- [ ] "View All" buttons work
- [ ] Status badges display correctly

### Recent Inquiries
- [ ] Shows up to 3 recent inquiries
- [ ] Unread indicator (blue dot) appears
- [ ] Click inquiry → navigates to detail
- [ ] Shows "No inquiries yet" if empty

---

## 2️⃣ Design Studio - List View (`/associates/design-studio`)

### Page Layout
- [ ] Header shows "Design Studio" title
- [ ] "Add Design Plan" button visible
- [ ] Search bar displays
- [ ] Filter button shows
- [ ] View toggle (Grid/List) works
- [ ] Results count shows "Showing X of Y"

### Mock Data
- [ ] 4 mock design plans display
- [ ] Each card shows:
  - [ ] Title
  - [ ] Category
  - [ ] Description (truncated)
  - [ ] Thumbnail image
  - [ ] Status badge (Published/Draft)
  - [ ] Stats (Views, Saves, Inquiries)
  - [ ] Price per sqft

### Search Functionality
- [ ] Type in search box
- [ ] Results filter in real-time
- [ ] Clear button (X) appears
- [ ] Clicking X clears search
- [ ] "No designs found" shows if no results

### Filters
- [ ] Click "Filters" button → panel expands
- [ ] Category dropdown works
- [ ] Status dropdown works
- [ ] Filter badge shows count
- [ ] "Clear all" button appears when filtering
- [ ] Results update when filters change

### Grid View
- [ ] Cards display in grid (3 columns)
- [ ] Hover effect (card lifts)
- [ ] Click card → navigates to detail page
- [ ] "..." menu button works
- [ ] Menu shows: Edit, Publish/Unpublish, Duplicate, Delete

### List View
- [ ] Click list icon → switches to list
- [ ] Items display as rows
- [ ] Thumbnail shows on left
- [ ] Edit button works
- [ ] Delete button works
- [ ] Click anywhere → navigates to detail

### Actions
- [ ] Edit → navigates to edit page
- [ ] Delete → shows confirmation
- [ ] Delete → removes item and shows toast
- [ ] Duplicate → creates copy with "(Copy)" suffix
- [ ] Publish/Unpublish → toggles status
- [ ] All actions show success toast

---

## 3️⃣ Design Studio - Create (`/associates/design-studio/create`)

### Page Layout
- [ ] "Create Design Plan" title shows
- [ ] "Back to Design Studio" button works
- [ ] All sections visible (Basic Info, Images, Specs, Pricing, Tags)

### Basic Information
- [ ] Title input accepts text
- [ ] Category dropdown works
- [ ] Style dropdown works
- [ ] Climate dropdown works
- [ ] Typology input accepts text
- [ ] Description textarea expands

### Images Section
- [ ] First image URL input shows
- [ ] "Add Image URL" button adds new input
- [ ] Remove button (X) removes URLs (minimum 1)
- [ ] Thumbnail preview shows when valid URL entered
- [ ] Invalid URL shows broken image gracefully

### Specifications
- [ ] All spec fields accept input:
  - [ ] Area (sqft)
  - [ ] Bedrooms
  - [ ] Bathrooms
  - [ ] Floors
  - [ ] Parking

### Pricing
- [ ] Price per sqft input accepts numbers
- [ ] Total price input accepts numbers
- [ ] Delivery time input accepts text

### Tags
- [ ] Tag input field works
- [ ] Press Enter → adds tag
- [ ] Click + button → adds tag
- [ ] Tags display with # prefix
- [ ] Click X on tag → removes it
- [ ] Duplicate tags prevented

### Form Validation
- [ ] Submit without title → shows error toast
- [ ] Submit without category → shows error toast

### Actions
- [ ] "Cancel" → goes back to list
- [ ] "Save as Draft" → creates draft design
- [ ] "Publish" → creates published design
- [ ] Success toast appears
- [ ] Redirects to list after save
- [ ] New design appears in list

---

## 4️⃣ Design Studio - Detail (`/associates/design-studio/:id`)

### Page Layout
- [ ] "Back to Design Studio" button works
- [ ] Preview/Edit View toggle works
- [ ] Share button copies link
- [ ] Success toast shows "Link copied"

### Status Banner (Edit Mode)
- [ ] Shows current status badge
- [ ] "Publish/Unpublish" button works
- [ ] "Edit" button → navigates to edit page
- [ ] "Duplicate" button creates copy
- [ ] "Delete" button shows confirmation

### Image Gallery
- [ ] Main image displays
- [ ] Thumbnail grid shows (if multiple images)
- [ ] Click thumbnail → changes main image
- [ ] Selected thumbnail has blue border

### Content
- [ ] Title displays
- [ ] Category and metadata show
- [ ] Full description shows
- [ ] Tags display with purple background

### Specifications
- [ ] All specs display in table format
- [ ] Values show correctly

### Sidebar
- [ ] Performance stats show:
  - [ ] Views count
  - [ ] Saves count
  - [ ] Inquiries count
- [ ] Pricing shows:
  - [ ] Per sqft price
  - [ ] Total price
  - [ ] Delivery time
- [ ] Metadata shows:
  - [ ] Created date
  - [ ] Last updated date
  - [ ] Climate (if set)

---

## 5️⃣ Design Studio - Edit (`/associates/design-studio/:id/edit`)

### Pre-fill
- [ ] Form loads with existing data
- [ ] All fields populated correctly
- [ ] Images array shows existing URLs
- [ ] Tags array shows existing tags

### Modifications
- [ ] Change title → saves correctly
- [ ] Change category → saves correctly
- [ ] Add new image URL → saves
- [ ] Remove image URL → saves
- [ ] Modify specs → saves
- [ ] Change pricing → saves
- [ ] Add/remove tags → saves

### Save
- [ ] "Save as Draft" → keeps as draft or changes to draft
- [ ] "Update & Publish" → publishes changes
- [ ] Success toast shows
- [ ] Redirects to list
- [ ] Changes visible in list

---

## 6️⃣ Skill Studio - List View (`/associates/skill-studio`)

### Page Layout
- [ ] Header shows "Skill Studio" title
- [ ] "Add Service" button works (purple/pink gradient)
- [ ] Search bar displays
- [ ] Filters work
- [ ] Grid/List toggle works
- [ ] Shows "Showing X of Y services"

### Mock Data
- [ ] 3 mock services display
- [ ] Each card shows:
  - [ ] Title
  - [ ] Category
  - [ ] Description
  - [ ] Thumbnail
  - [ ] Status badge
  - [ ] Star rating (if available)
  - [ ] Popular package price
  - [ ] Stats (Views, Saves, Inquiries)

### Features (Same as Design Studio)
- [ ] Search works
- [ ] Filters work (Category, Status)
- [ ] Grid view displays cards
- [ ] List view displays rows
- [ ] Actions menu works (Edit, Delete, Duplicate, Publish)
- [ ] Empty state shows when no results

---

## 7️⃣ Skill Studio - Create (`/associates/skill-studio/create`)

### Page Layout
- [ ] "Create Service" title shows
- [ ] All sections visible (Basic Info, Packages, Requirements, Images, Portfolio, Tags)

### Basic Information
- [ ] Title input works
- [ ] Category dropdown works
- [ ] Description textarea works

### Pricing Packages
- [ ] One package shows by default
- [ ] "Add Package" button adds new package
- [ ] Remove package button works (minimum 1)
- [ ] Package fields work:
  - [ ] Name input
  - [ ] Price input (numbers only)
  - [ ] Delivery time input
  - [ ] "Most Popular" checkbox
- [ ] Features list:
  - [ ] Add feature button works
  - [ ] Remove feature button works
  - [ ] Feature input accepts text

### Requirements
- [ ] One requirement input shows
- [ ] "Add Requirement" button works
- [ ] Remove button works (minimum 1)
- [ ] Text input works

### Images
- [ ] Image URLs can be added
- [ ] Remove button works
- [ ] Preview shows for first image

### Portfolio
- [ ] Portfolio URLs can be added
- [ ] Remove button works

### Tags
- [ ] Tag input works
- [ ] Press Enter adds tag
- [ ] Remove tag works

### Form Validation
- [ ] Submit without title → error toast
- [ ] Submit without package name → error toast
- [ ] Submit without price → error toast

### Actions
- [ ] "Cancel" → goes back
- [ ] "Save as Draft" → creates draft
- [ ] "Publish" → creates published service
- [ ] Success toast appears
- [ ] Redirects to list

---

## 8️⃣ Skill Studio - Detail (`/associates/skill-studio/:id`)

### Page Layout
- [ ] "Back to Skill Studio" button works
- [ ] Preview toggle works
- [ ] Share button works

### Status Banner
- [ ] Shows status badge
- [ ] Action buttons work (Edit, Duplicate, Delete, Publish)

### Content
- [ ] Title and category show
- [ ] Star rating displays (if available)
- [ ] Full description shows
- [ ] Tags display

### Pricing Packages
- [ ] All packages display in grid (3 columns)
- [ ] Popular package highlighted
- [ ] "Most Popular" badge shows
- [ ] Package details show:
  - [ ] Name
  - [ ] Price
  - [ ] Delivery time
  - [ ] Features list with checkmarks

### Requirements
- [ ] Requirements list shows
- [ ] Each item has blue checkmark icon

### Portfolio
- [ ] Portfolio images display in grid
- [ ] Images load correctly

### Sidebar
- [ ] Performance stats show
- [ ] Service details show:
  - [ ] Created date
  - [ ] Updated date
  - [ ] Rating (if available)

---

## 9️⃣ Skill Studio - Edit (`/associates/skill-studio/:id/edit`)

### Pre-fill
- [ ] All fields load with existing data
- [ ] Packages array populates
- [ ] Requirements array populates
- [ ] Images and portfolio URLs populate
- [ ] Tags populate

### Modifications
- [ ] Can modify all fields
- [ ] Can add/remove packages
- [ ] Can add/remove features in packages
- [ ] Can add/remove requirements
- [ ] Changes save correctly

### Save
- [ ] "Save as Draft" works
- [ ] "Update & Publish" works
- [ ] Success toast shows
- [ ] Redirects to list
- [ ] Changes visible in list

---

## 🔟 localStorage Verification

### Check Data
1. Open DevTools → Application → Local Storage → `http://localhost:5175`
2. Verify keys exist:
   - [ ] `associate_design_plans`
   - [ ] `associate_services`
   - [ ] `associate_inquiries`
   - [ ] `associate_analytics`
   - [ ] `user`

### Check Values
- [ ] Click on each key → JSON data displays
- [ ] Design plans array has objects
- [ ] Services array has objects
- [ ] Inquiries array has objects

### Reset Data
- [ ] Run: `localStorage.clear()` in console
- [ ] Reload page
- [ ] Mock data re-seeds automatically

---

## 🎨 Visual & UX Testing

### Animations
- [ ] Page transitions smooth
- [ ] Card hover effects work
- [ ] Button hover states work
- [ ] Modal/menu animations smooth

### Responsive Design
- [ ] Desktop (1920px) looks good
- [ ] Laptop (1440px) looks good
- [ ] Tablet (768px) works
- [ ] Mobile (375px) works
- [ ] Grid → single column on mobile
- [ ] Navbar responsive

### Colors & Theme
- [ ] Blue gradient for Design Studio
- [ ] Purple gradient for Skill Studio
- [ ] Status badges colored correctly
- [ ] Text readable (good contrast)

### Icons
- [ ] All icons display
- [ ] Icons appropriate for actions
- [ ] No broken icon references

---

## 🐛 Error Handling

### Test Error Cases
- [ ] Submit empty form → friendly error message
- [ ] Invalid image URL → doesn't break page
- [ ] Delete last item → list shows empty state
- [ ] Navigate to invalid ID → redirects or shows 404

### Console
- [ ] No React errors
- [ ] No warning messages
- [ ] No network errors (expected since no backend)

---

## ✅ Final Checklist

- [ ] All features work as expected
- [ ] No console errors
- [ ] Data persists after page reload
- [ ] All navigation works
- [ ] All CRUD operations work
- [ ] Mock data loads automatically
- [ ] Toast notifications appear
- [ ] Forms validate correctly
- [ ] UI is responsive
- [ ] Animations are smooth

---

## 📊 Test Results

**Date:** _________________

**Tester:** _________________

**Pass Rate:** _____ / _____ tests passed

**Issues Found:**
1. _________________________________________________
2. _________________________________________________
3. _________________________________________________

**Notes:**
_________________________________________________________
_________________________________________________________
_________________________________________________________

---

**All tests passed?** 🎉 Great job! The platform is ready to use!

**Found issues?** Check the [Developer Guide](./ASSOCIATE_PLATFORM_GUIDE.md) for solutions.
