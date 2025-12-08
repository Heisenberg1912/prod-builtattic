# 📘 Associate Platform - Developer Guide

## 🎯 Overview

This is a complete **Associate Management Platform** for the Builtattic marketplace. Associates can manage their design plans and service offerings using a modern, intuitive interface with **localStorage-based data persistence** (no backend required for development).

---

## 📂 Project Structure

```
client/src/
├── services/                    # Data management (localStorage CRUD)
│   ├── associateDesigns.js     # Design plans operations
│   ├── associateServices.js    # Services operations
│   ├── inquiries.js            # Message management
│   └── analytics.js            # View tracking & stats
│
├── data/                        # Mock data generators
│   ├── mockDesigns.js          # Sample design plans (4 items)
│   ├── mockServices.js         # Sample services (3 items)
│   └── mockInquiries.js        # Sample messages (5 items)
│
├── components/
│   ├── associate/              # Associate-specific components
│   │   ├── StatusBadge.jsx    # Draft/Published indicator
│   │   └── StatsCard.jsx      # Dashboard statistics card
│   └── shared/                 # Reusable components
│       └── EmptyState.jsx     # Empty state placeholder
│
└── pages/
    └── associates/
        ├── AssociateDashboard.jsx           # Main dashboard
        ├── design-studio/
        │   ├── DesignStudioList.jsx        # Design plans grid/list
        │   ├── DesignStudioDetail.jsx      # Single design view
        │   └── DesignStudioCreate.jsx      # Create/edit design
        └── skill-studio/
            ├── SkillStudioList.jsx         # Services grid/list
            ├── SkillStudioDetail.jsx       # Single service view
            └── SkillStudioCreate.jsx       # Create/edit service
```

---

## 🚀 Quick Start

### 1. Start Development Server
```bash
cd client
npm run dev
```

Server runs at: **http://localhost:5175**

### 2. Access the Platform

**Main Dashboard:**
```
http://localhost:5175/associates/dashboard
```

**Design Studio (Plans):**
```
http://localhost:5175/associates/design-studio
```

**Skill Studio (Services):**
```
http://localhost:5175/associates/skill-studio
```

---

## 📊 Features Implemented

### ✅ Dashboard (`AssociateDashboard.jsx`)
- **Profile completion tracker** with progress bar
- **4 stat cards**: Views, Published Items, Saves, Inquiries
- **Quick actions**: Add Plan, Add Service, View Inbox, Analytics
- **Overview panels**: Design Plans & Services summaries
- **Recent inquiries** feed with click-to-view

### ✅ Design Studio (Architectural Plans)
**List View** (`DesignStudioList.jsx`):
- Grid & List view toggle
- Search functionality
- Category & Status filters
- Actions: Edit, Delete, Duplicate, Publish/Unpublish
- Performance stats per item

**Detail View** (`DesignStudioDetail.jsx`):
- Image gallery with thumbnails
- Full specifications table
- Pricing breakdown
- Performance analytics
- Preview mode toggle
- Share functionality

**Create/Edit** (`DesignStudioCreate.jsx`):
- Multi-step form
- Image URL management
- Specifications builder
- Pricing calculator
- Tags system
- Draft/Publish options

### ✅ Skill Studio (Services)
**List View** (`SkillStudioList.jsx`):
- Grid & List view toggle
- Search & filters
- Package pricing display
- Star ratings
- Performance metrics

**Detail View** (`SkillStudioDetail.jsx`):
- Service overview
- Pricing packages comparison
- Requirements checklist
- Portfolio examples gallery
- Customer reviews section

**Create/Edit** (`SkillStudioCreate.jsx`):
- Package builder (Basic/Standard/Premium)
- Feature list manager
- Requirements checklist
- Portfolio URL manager
- Tags system

---

## 💾 Data Storage (localStorage)

### Storage Keys
```javascript
localStorage.setItem('associate_design_plans', [...])   // All design plans
localStorage.setItem('associate_services', [...])       // All services
localStorage.setItem('associate_inquiries', [...])      // All messages
localStorage.setItem('associate_analytics', [...])      // View events
localStorage.setItem('user', {...})                     // Current user
```

### Data Structures

#### Design Plan Object
```javascript
{
  id: "design-1",
  userId: "demo-user-1",
  title: "Modern Coastal Villa Design",
  category: "Residential",
  typology: "Villa",
  style: "Modern",
  climate: "Tropical",
  description: "Full description...",
  thumbnail: "https://...",
  images: ["url1", "url2"],
  specifications: {
    area: "3500 sqft",
    bedrooms: 4,
    bathrooms: 3,
    floors: 2
  },
  priceSqft: 450,
  totalPrice: 1575000,
  deliveryTime: "45-60 days",
  tags: ["modern", "villa", "coastal"],
  status: "published", // or "draft"
  views: 234,
  saves: 18,
  inquiries: 5,
  createdAt: "2025-01-15T10:00:00Z",
  updatedAt: "2025-01-20T14:30:00Z"
}
```

#### Service Object
```javascript
{
  id: "service-1",
  userId: "demo-user-1",
  title: "3D Architectural Visualization",
  category: "Rendering",
  description: "Full description...",
  thumbnail: "https://...",
  images: ["url1", "url2"],
  packages: [
    {
      name: "Basic",
      price: 500,
      deliveryTime: "3-5 days",
      features: ["2 exterior views", "HD resolution"],
      popular: false
    },
    {
      name: "Standard",
      price: 1200,
      deliveryTime: "5-7 days",
      features: ["4 exterior + 2 interior views"],
      popular: true
    }
  ],
  requirements: ["CAD files", "Material specs"],
  portfolio: ["url1", "url2", "url3"],
  tags: ["3d", "rendering"],
  status: "published",
  views: 456,
  saves: 34,
  inquiries: 12,
  rating: 4.8,
  reviewCount: 23,
  createdAt: "2025-01-08T10:00:00Z",
  updatedAt: "2025-01-20T14:00:00Z"
}
```

---

## 🛠️ Service Layer (API)

### Design Plans Service (`associateDesigns.js`)

```javascript
// READ
getAllDesigns()                    // Get all for current user
getDesignById(id)                  // Get single design
getPublishedDesigns(userId?)       // Get published only
getDesignStats()                   // Get summary stats

// WRITE
createDesign(designData)           // Create new
updateDesign(id, updates)          // Update existing
deleteDesign(id)                   // Delete
duplicateDesign(id)                // Duplicate
togglePublishStatus(id)            // Toggle draft/published

// ANALYTICS
incrementViews(id)                 // Track view
```

### Services Service (`associateServices.js`)

```javascript
// Same API as associateDesigns.js
getAllServices()
getServiceById(id)
createService(serviceData)
updateService(id, updates)
deleteService(id)
duplicateService(id)
togglePublishStatus(id)
getServiceStats()
incrementViews(id)
```

### Inquiries Service (`inquiries.js`)

```javascript
getAllInquiries()                  // Get all messages
getUnreadCount()                   // Count unread
getInquiryById(id)                 // Get single message
createInquiry(inquiryData)         // New inquiry
markAsRead(id)                     // Mark read
markAsUnread(id)                   // Mark unread
archiveInquiry(id)                 // Archive
deleteInquiry(id)                  // Delete
addReply(inquiryId, replyData)     // Reply to message
getInquiryStats()                  // Summary stats
```

### Analytics Service (`analytics.js`)

```javascript
trackView(itemType, itemId)        // Track view event
trackSave(itemType, itemId)        // Track save event
trackInquiry(itemType, itemId)     // Track inquiry
getAnalyticsSummary(days)          // Get stats for period
getDailyViews(days)                // Chart data
getTopPerforming(itemType, limit)  // Top items
getGrowthPercentage(days)          // % change
```

---

## 🎨 UI Components

### StatusBadge
```jsx
<StatusBadge
  status="published"  // or "draft"
  size="sm"           // or "default", "lg"
  showIcon={true}     // optional
/>
```

### StatsCard
```jsx
<StatsCard
  title="Total Views"
  value="1,234"
  icon={Eye}
  trend={12}                    // optional: +12%
  trendLabel="vs last month"    // optional
  color="blue"                  // or "purple", "green", "orange"
  delay={0.1}                   // animation delay
/>
```

### EmptyState
```jsx
<EmptyState
  icon={Plus}
  title="No items yet"
  description="Create your first item to get started"
  actionLabel="Add Item"
  onAction={() => navigate('/create')}
  secondaryActionLabel="Learn More"  // optional
  onSecondaryAction={() => {}}        // optional
/>
```

---

## 🧪 Testing Guide

### 1. Test Dashboard
```
URL: http://localhost:5175/associates/dashboard

✓ See 4 stat cards with mock data
✓ Profile completion shows percentage
✓ Click "Add Design Plan" → goes to create page
✓ Click "Add Service" → goes to create page
✓ See recent inquiries (5 mock messages)
✓ Overview panels show counts
```

### 2. Test Design Studio

**List View:**
```
URL: http://localhost:5175/associates/design-studio

✓ See 4 mock design plans
✓ Toggle Grid ↔ List view
✓ Search by title/description
✓ Filter by category
✓ Filter by status (All/Published/Draft)
✓ Click "..." menu → Edit/Delete/Duplicate/Publish
✓ Click card → view details
```

**Create New:**
```
URL: http://localhost:5175/associates/design-studio/create

✓ Fill in title, category, description
✓ Add image URLs (use Unsplash: https://images.unsplash.com/...)
✓ Add specifications (area, bedrooms, etc.)
✓ Set pricing (per sqft, total)
✓ Add tags (press Enter to add)
✓ Click "Save as Draft" → saves as draft
✓ Click "Publish" → saves as published
✓ Redirects to list page
```

**View Details:**
```
URL: http://localhost:5175/associates/design-studio/design-1

✓ See image gallery with thumbnails
✓ View all specifications
✓ See pricing breakdown
✓ View performance stats
✓ Click "Edit" → goes to edit page
✓ Click "Delete" → confirms and deletes
✓ Click "Duplicate" → creates copy
✓ Click "Publish/Unpublish" → toggles status
✓ Click "Share" → copies link
✓ Toggle "Preview" mode
```

**Edit Existing:**
```
URL: http://localhost:5175/associates/design-studio/design-1/edit

✓ Form pre-filled with existing data
✓ Modify any fields
✓ Click "Update & Publish" → saves changes
✓ Redirects to list page
```

### 3. Test Skill Studio

**Same flow as Design Studio, but for services:**
```
List:   http://localhost:5175/associates/skill-studio
Create: http://localhost:5175/associates/skill-studio/create
Detail: http://localhost:5175/associates/skill-studio/service-1
Edit:   http://localhost:5175/associates/skill-studio/service-1/edit
```

**Additional Features:**
```
✓ Add multiple pricing packages (Basic/Standard/Premium)
✓ Add features to each package
✓ Mark one package as "Most Popular"
✓ Add requirements checklist
✓ Add portfolio example images
```

---

## 🐛 Common Issues & Solutions

### Issue: Mock data not showing
**Solution:** Open browser DevTools → Console, run:
```javascript
localStorage.clear();
location.reload();
```
This resets localStorage and re-seeds mock data.

### Issue: Images not loading
**Solution:** Use valid image URLs. Recommended sources:
- Unsplash: `https://images.unsplash.com/photo-[id]?w=800`
- Placeholder: `https://via.placeholder.com/800x600`

### Issue: Forms not saving
**Solution:** Check browser console for errors. Ensure:
- Title is filled
- Category is selected
- At least one package has name & price (for services)

### Issue: Navigation not working
**Solution:** Make sure dev server is running:
```bash
cd client && npm run dev
```

---

## 🔧 Customization Guide

### Add New Fields to Design Plans

1. **Update Service:**
```javascript
// client/src/services/associateDesigns.js
const newDesign = {
  // ... existing fields
  newField: designData.newField,  // Add here
}
```

2. **Update Create Form:**
```javascript
// client/src/pages/associates/design-studio/DesignStudioCreate.jsx
const [formData, setFormData] = useState({
  // ... existing fields
  newField: "",  // Add here
});

// Add input in form
<Input
  value={formData.newField}
  onChange={(e) => handleInputChange("newField", e.target.value)}
/>
```

3. **Update Detail View:**
```javascript
// client/src/pages/associates/design-studio/DesignStudioDetail.jsx
<div>
  <Label>New Field</Label>
  <p>{design.newField}</p>
</div>
```

### Change Color Scheme

**Dashboard Stats:**
```javascript
// client/src/pages/associates/AssociateDashboard.jsx
<StatsCard color="blue" />    // Change to: "purple", "green", "orange"
```

**Gradients:**
```javascript
// Find and replace:
from-blue-600 to-cyan-600     // Design Studio
from-purple-600 to-pink-600   // Skill Studio
```

### Add New Filters

**Example: Add "Price Range" filter to Design Studio:**

1. **Add state:**
```javascript
const [priceRange, setPriceRange] = useState({ min: 0, max: 10000 });
```

2. **Add to filter function:**
```javascript
if (priceRange.min > 0 || priceRange.max < 10000) {
  filtered = filtered.filter(d =>
    d.priceSqft >= priceRange.min && d.priceSqft <= priceRange.max
  );
}
```

3. **Add UI:**
```jsx
<Label>Price Range</Label>
<Input
  type="range"
  min={0}
  max={10000}
  value={priceRange.max}
  onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
/>
```

---

## 📝 Code Conventions

### File Naming
- Components: `PascalCase.jsx`
- Services: `camelCase.js`
- Utilities: `camelCase.js`

### Component Structure
```javascript
/**
 * Component Name
 * Brief description
 */

// Imports
import { ... } from "...";

// Constants
const CONSTANT_NAME = "value";

// Main Component
export default function ComponentName() {
  // State
  const [state, setState] = useState();

  // Effects
  useEffect(() => {}, []);

  // Handlers
  const handleEvent = () => {};

  // Render
  return <div>...</div>;
}

// Sub-components (if any)
function SubComponent() {
  return <div>...</div>;
}
```

### Comments
```javascript
// Single line for brief explanations

/**
 * Multi-line for function documentation
 * @param {string} id - The item ID
 * @returns {Object} The item object
 */
```

---

## 🚀 Next Steps

### Immediate Enhancements
1. **Add image upload** (instead of URLs)
2. **Add pagination** to list views
3. **Add sorting options** (price, date, views)
4. **Add bulk actions** (delete multiple)

### Phase 4 Features (Not Yet Implemented)
- Inquiry inbox with threads
- Reply to messages
- Notification system
- Unread badge

### Phase 5 Features (Not Yet Implemented)
- Public portfolio page
- Shareable profile URL
- Social media integration

### Backend Migration (When Ready)
- Replace localStorage calls with API calls
- Update service files (same interface!)
- Components stay unchanged

---

## 📞 Support

**Need Help?**
1. Check browser console for errors
2. Review this guide
3. Check mock data in localStorage (DevTools)
4. Clear localStorage and reload

**Happy Coding!** 🎨✨
