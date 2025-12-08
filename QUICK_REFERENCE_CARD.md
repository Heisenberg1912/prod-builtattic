# Quick Reference Card - New Dashboard System

## 🚀 Getting Started (30 seconds)
```bash
# Terminal 1
cd server && npm run dev

# Terminal 2
cd client && npm run dev

# Browser
http://localhost:5173/dashboard
```

---

## 🎯 Main Routes

| What | Where | Who |
|------|-------|-----|
| **Main Dashboard** | `/dashboard` | Associates, Firms |
| **Design Studio** | `/dashboard/new-design-studio` | Create projects |
| **Skill Studio** | `/dashboard/new-skill-studio` | Professional profile |

---

## 📝 Quick Actions

### Design Studio (Create Project)
```
1. Click "New Project"
2. Title: "My Awesome Design"
3. Category: Architecture
4. Tags: modern, villa, luxury
5. [Create Project]
6. Click upload icon → Select file → Done!
7. Click [Publish] when ready
```

### Skill Studio (Setup Profile)
```
1. Fill Name, Title, Bio
2. Add skills: "AutoCAD, Revit, 3ds Max"
3. Click [Add Service]
   - Name: "Architectural Consultation"
   - Price: $150
   - Duration: "1 hour"
4. Click [Add Item] for portfolio
5. Toggle [Private] → [Public]
```

---

## 🔗 API Endpoints (Quick Copy)

### Dashboard
```javascript
// Get all data
GET /new-dashboard

// Get stats only
GET /new-dashboard/stats
```

### Design Studio
```javascript
// List projects
GET /new-design-studio/projects

// Create project
POST /new-design-studio/projects
Body: { title, description, category, tags }

// Update project
PATCH /new-design-studio/projects/:id
Body: { title, description, category, tags }

// Publish project
POST /new-design-studio/projects/:id/publish

// Delete project
DELETE /new-design-studio/projects/:id

// Upload media
POST /new-design-studio/projects/:id/media
Body: FormData with 'file'
```

### Skill Studio
```javascript
// Get profile
GET /new-skill-studio/profile

// Update profile
PATCH /new-skill-studio/profile
Body: { profileName, title, bio, location, hourlyRate, skills, availability }

// Add service
POST /new-skill-studio/services
Body: { name, description, price, duration }

// Update service
PATCH /new-skill-studio/services/:serviceId
Body: { name, description, price, duration }

// Delete service
DELETE /new-skill-studio/services/:serviceId

// Add portfolio
POST /new-skill-studio/portfolio
Body: { title, description, imageUrl, projectUrl }

// Delete portfolio
DELETE /new-skill-studio/portfolio/:itemId

// Toggle public
POST /new-skill-studio/toggle-public
Body: { isPublic }

// Upload image
POST /new-skill-studio/upload/:type
Body: FormData with 'file'
:type = 'avatar' or 'cover'
```

---

## 🎨 Component Imports

```javascript
// Dashboard
import Dashboard from "./pages/dashboard/Dashboard";

// Design Studio
import DesignStudio from "./pages/dashboard/DesignStudio";

// Skill Studio
import SkillStudio from "./pages/dashboard/SkillStudio";

// API Services
import * as dashboardAPI from "./services/newDashboard";
import * as designStudioAPI from "./services/newDesignStudio";
import * as skillStudioAPI from "./services/newSkillStudio";
```

---

## 🎭 User Roles Quick Reference

| Role | Access | Dashboard Route |
|------|--------|----------------|
| `user` | Browse & shop | `/dashboard` |
| `associate` | Design + Skill Studios | `/dashboard` |
| `firm` | Design + Skill + Teams | `/dashboard` |
| `vendor` | Products & sales | `/dashboard/vendor` |
| `client` | Hire & projects | `/dashboard/client` |
| `admin` | Moderate | `/dashboard/admin` |
| `superadmin` | Full control | `/dashboard/super-admin` |

---

## 🔐 Auth Quick Check

```javascript
// Check if logged in
const token = localStorage.getItem('auth_token');

// Get user role
const role = localStorage.getItem('role');

// Get user data
const user = JSON.parse(localStorage.getItem('user'));

// Logout
localStorage.clear();
navigate('/login');
```

---

## 🎨 Color Classes (Tailwind)

```css
/* Design Studio */
.design-gradient { @apply bg-gradient-to-r from-purple-500 to-pink-500; }

/* Skill Studio */
.skill-gradient { @apply bg-gradient-to-r from-blue-500 to-cyan-500; }

/* Background */
.page-bg { @apply bg-gradient-to-br from-slate-50 via-white to-slate-100; }

/* Cards */
.card { @apply bg-white rounded-2xl shadow-sm border border-slate-200; }

/* Buttons */
.btn-primary { @apply px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:shadow-lg; }
```

---

## 📊 Database Models Quick Reference

```javascript
// DesignStudio
{
  userId, title, description, category, tags,
  images: [{ url, thumbnail, caption }],
  files: [{ url, fileName, fileSize, fileType }],
  status: 'draft'|'published'|'archived',
  views, likes
}

// SkillStudio
{
  userId, profileName, title, bio, location,
  hourlyRate, avatar, coverImage, skills: [],
  services: [{ name, description, price, duration }],
  portfolio: [{ title, description, imageUrl, projectUrl }],
  availability: 'available'|'busy'|'unavailable',
  socialLinks, isPublic
}
```

---

## 🔧 Troubleshooting 1-2-3

### 1. Error on Start
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### 2. Dashboard Not Loading
```javascript
// Check these in browser console:
localStorage.getItem('auth_token')  // Should exist
localStorage.getItem('role')        // Should be valid
// Check Network tab for API errors
```

### 3. File Upload Failing
```javascript
// Verify:
- File size < 10MB
- Correct MIME type
- Google Drive credentials configured
// Check backend logs for details
```

---

## 🎯 Common Tasks

### Create & Publish Project (30 sec)
```
Dashboard → Design Studio → New Project →
Fill form → Create → Upload image → Publish
```

### Complete Profile (2 min)
```
Dashboard → Skill Studio → Fill profile →
Add skills → Add 2-3 services →
Add portfolio item → Toggle Public
```

### Handle Client Enquiry (Associate)
```
/associate/enquiry → View enquiry →
Respond with quote → Schedule meeting →
Accept order → Deliver service
```

### Hire Associate (Client)
```
/associates → Browse → View profile →
Submit enquiry → Schedule consultation →
Accept quote → Place order →
Track in workspace
```

---

## 📱 Responsive Breakpoints

```css
/* Mobile First */
default    /* < 640px */
sm:        /* 640px+ */
md:        /* 768px+ */
lg:        /* 1024px+ */
xl:        /* 1280px+ */
```

---

## 🎬 Quick Demo Script

### For Associates (2 min demo)
```
1. "Here's your new unified dashboard with stats"
2. "Click Design Studio to host your projects"
3. "Create project, upload renders, publish"
4. "Click Skill Studio for your professional profile"
5. "Add services with pricing, portfolio items"
6. "Toggle to Public when ready to share"
7. "Everything tracked with views and likes"
```

### For Clients (1 min demo)
```
1. "Browse associates at /associates"
2. "View their Skill Studio profiles"
3. "Check services, rates, portfolio"
4. "Submit enquiry for your project"
5. "Schedule consultation"
6. "Place order and collaborate in workspace"
```

---

## 💡 Pro Tips

1. **Images:** Use imgbb.com or imgur.com for quick image URLs
2. **Tags:** Separate with commas: "modern, villa, luxury"
3. **Skills:** List most important first
4. **Services:** Price competitively, be specific on deliverables
5. **Portfolio:** Use high-quality images, write clear descriptions
6. **Profile:** Complete = More credible = More clients

---

## 📞 Need Help?

1. **Docs:** Check `NEW_DASHBOARD_IMPLEMENTATION.md`
2. **Flows:** See `USER_FLOWS_GUIDE.md`
3. **Visual:** View `VISUAL_USER_FLOWS.md`
4. **Summary:** Read `IMPLEMENTATION_SUMMARY.md`
5. **Console:** Check browser console for errors
6. **Network:** Check Network tab for API issues
7. **Logs:** Check backend terminal for server errors

---

## 🔗 Important Files

| What | Where |
|------|-------|
| Main Dashboard | `client/src/pages/dashboard/Dashboard.jsx` |
| Design Studio | `client/src/pages/dashboard/DesignStudio.jsx` |
| Skill Studio | `client/src/pages/dashboard/SkillStudio.jsx` |
| Dashboard API | `client/src/services/newDashboard.js` |
| Design API | `client/src/services/newDesignStudio.js` |
| Skill API | `client/src/services/newSkillStudio.js` |
| Routes Config | `client/src/App.jsx` |
| Server Routes | `server/src/app.js` |

---

## ✅ Pre-Launch Checklist

- [ ] Backend running on :5000
- [ ] Frontend running on :5173
- [ ] Can login successfully
- [ ] Dashboard loads with stats
- [ ] Can create design project
- [ ] Can upload media
- [ ] Can publish project
- [ ] Can update profile
- [ ] Can add service
- [ ] Can add portfolio item
- [ ] Public toggle works
- [ ] All forms validate
- [ ] Toast notifications show
- [ ] Responsive on mobile

---

## 🎉 You're Ready!

Everything is set up and working. Start creating! 🚀

**Main Entry Point:** `http://localhost:5173/dashboard`

**Next Steps:**
1. Create your first design project
2. Setup your professional profile
3. Add services and portfolio
4. Make profile public
5. Share with clients!
