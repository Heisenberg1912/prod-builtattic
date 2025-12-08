# Complete User Flows Guide

## Overview
This guide covers all user flows for different user types in the platform, including the new dashboard system for Design Studio and Skill Studio.

---

## 🎯 User Types & Roles

### 1. **Regular User** (role: `user`)
- Browse products and services
- Make purchases
- Manage wishlist and cart
- View order history

### 2. **Associate** (role: `associate`)
- Individual professional (architect, designer, etc.)
- Manage personal profile
- Offer services and consultations
- Showcase portfolio
- Host designs on Design Studio
- Build professional presence on Skill Studio

### 3. **Firm** (role: `firm`)
- Organization/company account
- Team management
- Service packages
- Firm portfolio
- Client project management

### 4. **Vendor** (role: `vendor`)
- Sell materials and products
- Manage inventory
- Process orders
- Sales dashboard

### 5. **Client** (role: `client`)
- Hire associates/firms
- Project management
- Schedule consultations
- Access to AI tools

### 6. **Admin** (role: `admin`)
- Moderate content
- Manage users
- Platform oversight

### 7. **Super Admin** (role: `superadmin`)
- Full platform control
- System configuration
- Analytics and reporting

---

## 📋 Complete User Flows by Role

## 1️⃣ Regular User Flow

### A. Registration & Onboarding
```
1. Navigate to /register
2. Fill in registration form:
   - Email address
   - Password
   - Name
   - Role selection (default: user)
3. Submit registration
4. Verify email (if enabled)
5. Redirected to /login
```

### B. Browsing & Shopping
```
1. Login at /login
2. Browse options:

   Option A: Products
   - Navigate to /products
   - Filter/search products
   - Click product for details (/products/:id)
   - Add to cart or wishlist

   Option B: Studio Services
   - Navigate to /studio
   - Browse design services
   - View studio details (/studio/:id)

   Option C: Warehouse
   - Navigate to /warehouse
   - Browse materials
   - View warehouse details (/warehouse/:id)

   Option D: Firms
   - Navigate to /firms
   - Browse architectural firms
   - View firm portfolios

   Option E: Associates
   - Navigate to /associates
   - Browse individual professionals
   - View associate portfolios (/associateportfolio/:id)
```

### C. Cart & Checkout
```
1. Add items to cart
2. Navigate to /cart or /cartpage
3. Review cart items
4. Proceed to checkout
5. Navigate to /buy or /buy/:id
6. Enter shipping information
7. Complete payment at /payments
8. View order confirmation
9. Track orders at /orders
```

### D. Wishlist Management
```
1. Navigate to /wishlist
2. View saved items
3. Move items to cart
4. Remove items from wishlist
```

### E. Account Management
```
1. Navigate to /account or /profile
2. Update profile information
3. Change settings at /settings
4. View order history at /orders
```

---

## 2️⃣ Associate Flow (Individual Professional)

### A. Initial Setup
```
1. Register with role: "associate"
2. Login at /login
3. Redirected to /dashboard (NEW unified dashboard)
4. See two studio options:
   - Design Studio (host designs)
   - Skill Studio (professional profile)
```

### B. Design Studio Setup (NEW)
```
Path: /dashboard → /dashboard/new-design-studio

1. Click "Design Studio" card on dashboard
2. Create first design project:
   - Click "New Project"
   - Fill in:
     * Title (required)
     * Description
     * Category (Architecture, Interior Design, etc.)
     * Tags (comma-separated)
   - Click "Create Project"

3. Upload project media:
   - Click upload icon on project card
   - Select files (images, videos, PDFs)
   - Files upload to Google Drive automatically
   - Thumbnails appear on project card

4. Manage project status:
   - Draft: Private, visible only to you
   - Published: Public, visible to all

5. Edit project:
   - Click "Edit" button
   - Update details
   - Click "Update Project"

6. Track metrics:
   - View count
   - Like count
   - Status badge

7. Delete project:
   - Click trash icon
   - Confirm deletion
```

### C. Skill Studio Setup (NEW)
```
Path: /dashboard → /dashboard/new-skill-studio

1. Click "Skill Studio" card on dashboard
2. Complete profile:

   Profile Basics:
   - Name
   - Professional title
   - Location
   - Hourly rate
   - Availability status (Available/Busy/Unavailable)
   - Click "Update Profile"

   About Section:
   - Write bio (description of expertise)
   - Click "Save Bio"

   Skills:
   - Enter skills comma-separated
   - Example: "AutoCAD, Revit, 3ds Max, SketchUp"
   - Click "Save Skills"
   - Skills display as colored tags

3. Add Services:
   - Click "Add Service"
   - Fill in:
     * Service name (required)
     * Description
     * Price
     * Duration
   - Click "Add Service"
   - Repeat for multiple services

4. Build Portfolio:
   - Click "Add Item"
   - Fill in:
     * Title (required)
     * Description
     * Image URL
     * Project URL
   - Click "Add Item"
   - Portfolio displays in grid layout

5. Make Profile Public:
   - Click "Private" toggle button
   - Button turns green showing "Public"
   - Profile now visible to everyone
```

### D. Associate Portal (Advanced Features)
```
Path: /associates/portal or /portal/associate

1. Navigate to Associate Portal
2. Complete comprehensive profile:
   - Full name, firm name (if applicable)
   - Experience years
   - Specializations
   - Software proficiency
   - Languages spoken
   - Certifications
   - Upload documents:
     * Profile image
     * Hero image
     * Cover image
     * Portfolio media
     * Verification documents

3. Manage services:
   - Create service packages
   - Set pricing and deliverables
   - Define availability windows

4. Handle consultations:
   - Schedule meetings
   - Set agenda and notes
   - Video call links
   - Recording uploads

5. Workspace management:
   - Project uploads
   - Client communications
   - File sharing
```

### E. Receiving Orders & Enquiries
```
Path: /associate/order or /associate/enquiry

1. Navigate to orders section:
   - View incoming service requests
   - Review client details
   - Accept or decline

2. Manage schedule:
   - Navigate to /associate/schedule
   - View upcoming consultations
   - Confirm availability
   - Join meetings

3. Handle enquiries:
   - Navigate to /associate/enquiry
   - Respond to client questions
   - Provide quotes
   - Convert to orders
```

### F. Dashboard Overview
```
Path: /dashboard (NEW unified dashboard)

View at a glance:
- Design Projects count (total, published, drafts)
- Total views across all projects
- Total likes from audience
- Services listed count
- Profile status (public/private)
- Quick navigation to both studios

Statistics Cards:
- Design Projects: Shows published/draft breakdown
- Total Views: Aggregate across all projects
- Total Likes: Engagement metric
- Services Listed: Number of active services
```

---

## 3️⃣ Firm Flow (Organization Account)

### A. Firm Setup
```
1. Register with role: "firm"
2. Login and complete firm profile
3. Navigate to /portal/firm or /portal/vendor

4. Complete organization details:
   - Firm name and slug
   - Category and styles
   - Team size
   - Registration ID
   - Office locations
   - Contact information

5. Upload firm assets:
   - Cover image
   - Gallery images
   - Logo
   - Verification documents

6. Define services:
   - Service categories
   - Pricing models
   - Deliverables
   - Timeline estimates
```

### B. Team Management
```
1. Add team members:
   - Invite associates
   - Assign roles
   - Set permissions

2. Manage memberships:
   - User memberships array
   - Role assignments (admin, member, etc.)
   - Title assignments

3. Collaborate on projects:
   - Shared workspaces
   - Team communications
   - Resource allocation
```

### C. Firm Portal Features
```
Path: /portal/firm

1. Service pack management:
   - Create service packages
   - Set pricing tiers
   - Define deliverables
   - Availability scheduling

2. Meeting management:
   - Schedule consultations
   - Client meetings
   - Internal reviews
   - Recording storage

3. Plan uploads:
   - Architectural plans
   - Renderings
   - Walkthroughs
   - Project documentation

4. Workspace collaboration:
   - Download workspace files
   - Share with clients
   - Version control
   - Comments and feedback
```

### D. Client Projects
```
1. Receive project requests
2. Proposal submission
3. Project acceptance
4. Milestone tracking
5. Deliverable uploads
6. Client approvals
7. Final delivery
8. Payment processing
```

### E. Firm Portfolio
```
Path: /firmportfolio

1. Showcase completed projects
2. Display key projects
3. Client testimonials
4. Awards and recognition
5. Public visibility control
```

---

## 4️⃣ Vendor Flow (Material Supplier)

### A. Vendor Setup
```
1. Register with role: "vendor"
2. Navigate to /portal/vendor
3. Complete vendor profile:
   - Business name
   - Contact details
   - Location
   - Business verification
```

### B. Product Management
```
Path: /portal/vendor/materials

1. Add products:
   - Navigate to materials section
   - Click "Add Material"
   - Fill in details:
     * Product name
     * Description
     * Price
     * Stock quantity
     * Category
     * Images
     * Specifications
   - Click "Save"

2. Manage inventory:
   - Update stock levels
   - Set low stock alerts
   - Manage variants
   - Bulk updates

3. Pricing management:
   - Set base prices
   - Volume discounts
   - Seasonal pricing
   - Special offers
```

### C. Sales Dashboard
```
Path: /dashboard/vendor

1. View sales metrics:
   - Daily/weekly/monthly sales
   - Revenue trends
   - Top selling products
   - Customer analytics

2. Order management:
   - Pending orders
   - Processing status
   - Shipping coordination
   - Delivery tracking

3. Customer interactions:
   - Inquiries
   - Reviews management
   - Support tickets
   - Feedback handling
```

### D. Warehouse Management
```
Path: /warehouse

1. List products in warehouse
2. Manage warehouse locations
3. Stock transfers
4. Quality control
5. Returns handling
```

---

## 5️⃣ Client Flow (Hiring Projects)

### A. Client Setup
```
1. Register with role: "client"
2. Login at /login
3. Navigate to /dashboard/client
```

### B. Finding Professionals
```
1. Browse associates:
   - Navigate to /associates
   - Filter by:
     * Specialization
     * Location
     * Rating
     * Hourly rate
     * Availability
   - View detailed profiles
   - Check portfolios

2. Browse firms:
   - Navigate to /firms
   - Filter by:
     * Category
     * Size
     * Experience
     * Location
     * Services offered
   - View firm portfolios
   - Check team credentials
```

### C. Hiring Process
```
1. Select professional/firm
2. View services offered
3. Request consultation:
   - Navigate to /associate/schedule/:id
   - Select available time slot
   - Provide project brief
   - Confirm booking

4. Submit enquiry:
   - Navigate to /associate/enquiry
   - Describe project requirements
   - Attach reference files
   - Request quote

5. Place order:
   - Navigate to /associate/order
   - Select service package
   - Agree to terms
   - Make payment
```

### D. Project Management
```
1. Track project status
2. Workspace access:
   - Navigate to workspace
   - View deliverables
   - Download files
   - Provide feedback
   - Request revisions

3. Communication:
   - Chat with professional
   - Schedule meetings
   - Review milestones
   - Approve deliverables

4. AI Tools:
   - Navigate to /ai
   - Use AI design tools
   - Generate concepts
   - Visualize ideas
```

### E. Client Dashboard
```
Path: /dashboard/client

1. Active projects overview
2. Upcoming consultations
3. Pending deliverables
4. Payment history
5. Saved professionals
6. Project documents
```

---

## 6️⃣ Admin Flow

### A. Admin Access
```
1. Login with admin credentials
2. Navigate to /dashboard/admin
```

### B. Content Moderation
```
1. Review flagged content:
   - User profiles
   - Project uploads
   - Reviews and comments
   - Service listings

2. Moderation actions:
   - Approve content
   - Reject content
   - Request modifications
   - Suspend accounts
   - Ban users

3. Quality control:
   - Verify professional credentials
   - Check portfolio authenticity
   - Monitor service quality
   - Handle disputes
```

### C. User Management
```
1. View all users
2. Edit user roles
3. Suspend/activate accounts
4. Reset passwords
5. Manage permissions
6. View user activity logs
```

### D. Studio Requests
```
Path: /studio/requests

1. Review studio applications
2. Verify documentation
3. Approve/reject studios
4. Monitor compliance
5. Handle appeals
```

### E. Access Requests
```
Path: /access-requests

1. Review special access requests
2. Verify credentials
3. Grant permissions
4. Track approved access
5. Revoke when needed
```

---

## 7️⃣ Super Admin Flow

### A. Super Admin Access
```
1. Login with superadmin credentials
2. Navigate to /dashboard/super-admin
```

### B. System Management
```
1. Platform configuration:
   - Environment settings
   - API configurations
   - Payment gateway setup
   - Email service config
   - Storage settings

2. Database management:
   - View collections
   - Run queries
   - Data backups
   - Performance monitoring

3. Security settings:
   - Authentication rules
   - Rate limiting
   - CORS configuration
   - JWT settings
```

### C. Analytics & Reporting
```
1. Platform metrics:
   - Total users by role
   - Active users
   - Revenue statistics
   - Growth trends

2. Performance metrics:
   - API response times
   - Error rates
   - Server health
   - Database performance

3. Generate reports:
   - User reports
   - Financial reports
   - Activity reports
   - Export data
```

### D. Advanced Features
```
1. Bulk operations:
   - Mass user updates
   - Bulk content moderation
   - System-wide announcements

2. Feature flags:
   - Enable/disable features
   - A/B testing
   - Gradual rollouts

3. System maintenance:
   - Schedule downtime
   - Run migrations
   - Clear caches
   - Update dependencies
```

---

## 🔄 Common Flows for All Users

### A. Authentication Flow
```
1. Initial visit:
   - Check localStorage for auth_token
   - If token exists:
     * Verify with backend
     * Load user data
     * Redirect to appropriate dashboard
   - If no token:
     * Show login/register options

2. Login:
   - Navigate to /login
   - Enter credentials
   - On success:
     * Store JWT token in localStorage
     * Store user data
     * Store role
     * Dispatch auth:login event
     * Redirect to dashboard

3. Logout:
   - Clear localStorage
   - Clear auth state
   - Redirect to /login

4. Password reset:
   - Navigate to /forgot-password
   - Enter email
   - Receive reset link
   - Navigate to /reset-password
   - Set new password
```

### B. Profile Management
```
1. Navigate to /profile or /account
2. Update personal information:
   - Name
   - Email
   - Phone
   - Address
3. Change password
4. Update preferences
5. Manage notifications
```

### C. Settings & Preferences
```
Path: /settings

1. Account settings:
   - Email preferences
   - Privacy settings
   - Security options
   - Two-factor authentication

2. Notification preferences:
   - Email notifications
   - Push notifications
   - SMS alerts

3. Display preferences:
   - Theme (if available)
   - Language
   - Currency
```

### D. Currency Conversion
```
Path: /currencyconver

1. View current currency
2. Select preferred currency
3. Convert amounts
4. Currency persists in localStorage
5. All prices display in selected currency
```

### E. Support & Help
```
1. Support chat widget:
   - Available on all pages
   - Real-time messaging
   - File attachments
   - Chat history

2. FAQs:
   - Navigate to /faqs
   - Browse common questions
   - Search for solutions

3. Contact support:
   - Navigate to /support
   - Submit ticket
   - Track status
   - Receive updates
```

### F. AI Tools
```
Path: /ai or /aisetting

1. Access AI features:
   - Design suggestions
   - Space planning
   - Material recommendations
   - Cost estimation

2. Use AI tools:
   - Upload reference images
   - Set parameters
   - Generate results
   - Save to projects

3. Configure AI:
   - Navigate to /aisetting
   - Adjust preferences
   - Set defaults
```

### G. Matters (Document Management)
```
Path: /matters

1. Upload documents
2. Organize by project
3. Share with team/clients
4. Version control
5. Access permissions
6. Download/view documents
```

---

## 🎯 Quick Navigation Reference

### Public Pages (No Auth Required)
```
/                    - Home page
/login               - Login page
/register            - Registration page
/forgot-password     - Password recovery
/reset-password      - Password reset
/products            - Product listings
/studio              - Studio listings
/warehouse           - Warehouse listings
/firms               - Firm directory
/associates          - Associate directory
/firmportfolio       - Firm portfolio view
/associateportfolio  - Associate portfolio view
/skillstudio         - Public skill studio view
```

### Authenticated Pages (Auth Required)
```
/dashboard                     - NEW Unified dashboard
/dashboard/new-design-studio   - NEW Design Studio (host designs)
/dashboard/new-skill-studio    - NEW Skill Studio (professional profile)
/profile                       - User profile
/account                       - Account settings
/settings                      - User preferences
/cart                         - Shopping cart
/cartpage                     - Cart page
/wishlist                     - Wishlist
/orders                       - Order history
/buy                          - Checkout
/ai                           - AI tools
/matters                      - Document management
```

### Role-Specific Dashboards
```
/dashboard/user         - User dashboard
/dashboard/client       - Client dashboard
/dashboard/vendor       - Vendor/sales dashboard
/dashboard/admin        - Admin dashboard
/dashboard/super-admin  - Super admin dashboard
/dashboard/studio-hub   - Studio hub (old)
```

### Associate/Firm Portals
```
/associates/portal      - Associate portal intro
/portal/associate       - Associate workspace
/associate/order        - View orders
/associate/schedule     - Schedule management
/associate/enquiry      - Handle enquiries
/portal/firm           - Firm portal
/portal/vendor         - Vendor portal
/portal/studio         - Studio workspace
```

### Old Dashboard Routes (Preserved)
```
/dashboard/old          - Old dashboard landing
/dashboard/design-studio - Old design studio
/dashboard/skill-studio  - Old skill studio
```

---

## 🎨 User Journey Examples

### Example 1: New Associate Onboarding
```
Day 1: Registration & Setup
1. Register as "associate"
2. Login → See new dashboard
3. Click "Design Studio"
4. Create first project: "Modern Villa Design"
5. Upload 3 renders
6. Keep as draft

Day 2: Build Profile
1. Click "Skill Studio"
2. Complete profile: Name, title, bio, location
3. Add skills: "Revit, AutoCAD, Lumion"
4. Add hourly rate: $75
5. Set availability: "Available"

Day 3: Add Services
1. Add service: "Architectural Consultation" - $150/hour
2. Add service: "3D Rendering" - $200/project
3. Add service: "Construction Drawings" - $500/project

Day 4: Portfolio & Go Public
1. Add portfolio items from past work
2. Upload project images
3. Add descriptions
4. Publish design project
5. Toggle profile to "Public"
6. Share profile link with potential clients

Week 2: First Client
1. Receive enquiry from client
2. Schedule consultation
3. Provide quote
4. Accept order
5. Deliver service
6. Get paid and reviewed
```

### Example 2: Client Hiring Process
```
Step 1: Find Professional
1. Browse /associates
2. Filter: "Interior Designer" + "New York" + "Available"
3. View top 3 profiles
4. Check portfolios and reviews

Step 2: Initial Contact
1. Click on preferred associate
2. View their Skill Studio profile
3. Check services and pricing
4. Submit enquiry with project details

Step 3: Consultation
1. Receive response
2. Schedule consultation
3. Join video meeting
4. Discuss project requirements
5. Receive quote

Step 4: Project Start
1. Accept quote
2. Place order
3. Make payment
4. Access project workspace
5. Collaborate on designs
6. Review deliverables
7. Request revisions if needed
8. Approve final delivery
9. Leave review
```

### Example 3: Vendor Product Listing
```
Step 1: Setup
1. Register as vendor
2. Complete business profile
3. Upload verification docs
4. Wait for admin approval

Step 2: List Products
1. Navigate to /portal/vendor/materials
2. Add first product: "Premium Italian Marble"
3. Upload product images
4. Set price: $150/sq ft
5. Add stock: 5000 sq ft
6. Publish listing

Step 3: Manage Orders
1. Receive order notification
2. View order details in dashboard
3. Confirm availability
4. Process order
5. Update shipping status
6. Receive payment
```

---

## 📱 Mobile Responsiveness

All flows are optimized for mobile devices:
- Responsive grid layouts
- Touch-friendly buttons
- Mobile navigation
- Swipe gestures
- Optimized forms
- Quick actions

---

## 🔐 Security Notes

1. **Authentication:** All protected routes check JWT token
2. **Authorization:** Role-based access control
3. **Data Isolation:** Users only see their own data
4. **File Upload Security:** MIME type validation, size limits
5. **Rate Limiting:** Prevents abuse
6. **CSRF Protection:** Token-based validation
7. **Password Security:** Hashed with bcrypt
8. **Session Management:** JWT expiration handling

---

## 💡 Pro Tips

### For Associates:
- Keep profile updated regularly
- Respond quickly to enquiries
- Upload high-quality portfolio images
- Set competitive pricing
- Maintain good availability
- Collect client reviews

### For Clients:
- Provide detailed project requirements
- Check reviews before hiring
- Communicate clearly
- Give timely feedback
- Build long-term relationships

### For Vendors:
- Update inventory regularly
- Provide accurate descriptions
- High-quality product images
- Competitive pricing
- Fast shipping
- Good customer service

### For All Users:
- Complete your profile fully
- Use high-quality images
- Enable notifications
- Check dashboard regularly
- Utilize AI tools
- Keep documents organized

---

This comprehensive guide covers all user flows for the platform. Each user type has a clear path from registration to active engagement with the platform features!
