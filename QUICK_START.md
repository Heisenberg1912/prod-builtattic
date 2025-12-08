# Quick Start Guide - New Dashboard System

## 🚀 Getting Started

### 1. Start the Application

```bash
# Terminal 1 - Backend
cd server
npm install
npm run dev

# Terminal 2 - Frontend
cd client
npm install
npm run dev
```

### 2. Access the Dashboard

1. Open browser to `http://localhost:5173`
2. Login with your account
3. Navigate to `/dashboard`

## 📍 Main Routes

| Route | Description |
|-------|-------------|
| `/dashboard` | Main unified dashboard |
| `/dashboard/new-design-studio` | Design Studio - Host your projects |
| `/dashboard/new-skill-studio` | Skill Studio - Professional profile |

## 🎨 Design Studio Quick Actions

1. **Create Project:**
   - Click "New Project"
   - Enter title (required)
   - Add description, category, tags
   - Click "Create Project"

2. **Upload Media:**
   - Click upload icon on project card
   - Select image/video/PDF
   - File uploads automatically

3. **Publish Project:**
   - Click "Publish" button on draft
   - Project becomes public

4. **Edit Project:**
   - Click "Edit" button
   - Modify details
   - Click "Update Project"

5. **Delete Project:**
   - Click trash icon
   - Confirm deletion

## 💼 Skill Studio Quick Actions

1. **Setup Profile:**
   - Fill in Name, Title, Bio
   - Add Location and Hourly Rate
   - Set Availability status
   - Click "Update Profile"

2. **Add Skills:**
   - Enter skills comma-separated
   - Example: "AutoCAD, Revit, 3ds Max"
   - Click "Save Skills"

3. **Add Service:**
   - Click "Add Service"
   - Enter service name (required)
   - Add description, price, duration
   - Click "Add Service"

4. **Add Portfolio Item:**
   - Click "Add Item"
   - Enter title (required)
   - Add description and image URL
   - Click "Add Item"

5. **Make Profile Public:**
   - Click "Private" toggle button
   - Button turns green showing "Public"

## 🔑 API Endpoints Reference

### Dashboard
```
GET /new-dashboard          # Get all dashboard data
GET /new-dashboard/stats    # Get quick statistics
```

### Design Studio
```
GET    /new-design-studio/projects           # List projects
POST   /new-design-studio/projects           # Create project
PATCH  /new-design-studio/projects/:id       # Update project
POST   /new-design-studio/projects/:id/publish  # Publish project
DELETE /new-design-studio/projects/:id       # Delete project
POST   /new-design-studio/projects/:id/media # Upload media
```

### Skill Studio
```
GET    /new-skill-studio/profile                    # Get profile
PATCH  /new-skill-studio/profile                    # Update profile
POST   /new-skill-studio/services                   # Add service
PATCH  /new-skill-studio/services/:serviceId        # Update service
DELETE /new-skill-studio/services/:serviceId        # Delete service
POST   /new-skill-studio/portfolio                  # Add portfolio
DELETE /new-skill-studio/portfolio/:itemId          # Delete portfolio
POST   /new-skill-studio/toggle-public              # Toggle visibility
POST   /new-skill-studio/upload/:type               # Upload image
```

## 📁 File Structure

```
server/src/
├── controllers/
│   ├── newDashboardController.js       # Dashboard logic
│   ├── newDesignStudioController.js    # Design Studio logic
│   └── newSkillStudioController.js     # Skill Studio logic
├── routes/
│   ├── newDashboard.js                 # Dashboard routes
│   ├── newDesignStudio.js              # Design Studio routes
│   └── newSkillStudio.js               # Skill Studio routes
└── app.js                              # Routes registered here

client/src/
├── pages/dashboard/
│   ├── Dashboard.jsx                   # Main dashboard UI
│   ├── DesignStudio.jsx                # Design Studio UI
│   └── SkillStudio.jsx                 # Skill Studio UI
├── services/
│   ├── newDashboard.js                 # Dashboard API
│   ├── newDesignStudio.js              # Design Studio API
│   └── newSkillStudio.js               # Skill Studio API
└── App.jsx                             # Routes configured here
```

## 🎨 Color Scheme

- **Design Studio:** Purple to Pink gradient
- **Skill Studio:** Blue to Cyan gradient
- **Background:** Slate gradient
- **Cards:** White with slate borders

## ✅ Features at a Glance

### Dashboard
- ✅ Overview of all activities
- ✅ Statistics (projects, views, likes, services)
- ✅ Quick navigation to studios

### Design Studio
- ✅ Unlimited projects
- ✅ Media uploads (images, videos, PDFs)
- ✅ Draft/published workflow
- ✅ Categories and tags
- ✅ View/like tracking

### Skill Studio
- ✅ Professional profile
- ✅ Skills management
- ✅ Service listings with pricing
- ✅ Portfolio showcase
- ✅ Public/private toggle
- ✅ Availability status

## 🐛 Quick Troubleshooting

**Dashboard not loading?**
- Check if logged in
- Verify backend is running on port 5000
- Check browser console for errors

**File upload failing?**
- Check file size (should be < 10MB)
- Verify Google Drive credentials configured
- Check network tab for detailed error

**Changes not saving?**
- Check form validation errors
- Verify network connection
- Check API response in network tab

**Routes not working?**
- Clear browser cache
- Restart both servers
- Check URL is correct

## 💡 Tips

1. **Save frequently** - Click save buttons after changes
2. **Use tags** - Help organize and find projects
3. **Add descriptions** - Make projects discoverable
4. **Keep profile updated** - Ensure info is current
5. **Test public view** - Toggle public to see what others see

## 🔐 Security Notes

- All routes require authentication
- Data is user-scoped (can't see others' data)
- JWT tokens validate all requests
- Files uploaded to secure Google Drive
- Rate limiting prevents abuse

## 📞 Need Help?

1. Check browser console for errors
2. Review network tab for API issues
3. Check backend logs for server errors
4. Refer to `NEW_DASHBOARD_IMPLEMENTATION.md` for details

## 🎯 Next Steps

1. **Create your first design project** in Design Studio
2. **Setup your professional profile** in Skill Studio
3. **Add services and portfolio items**
4. **Make your profile public** to share with others
5. **Upload media** to showcase your work

---

**You're all set!** Start creating and building your presence with the new dashboard system. 🚀
