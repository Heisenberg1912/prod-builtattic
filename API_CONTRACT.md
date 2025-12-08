# 🔌 API Contract - New Backend Specification

## Base URL
```
Development: http://localhost:4000/api
Production: https://api.builtattic.com/api
```

---

## 🔐 Authentication

### Register
**POST** `/auth/register`

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "role": "buyer" | "designer" | "associate" | "vendor"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Registration successful. Please verify your email.",
  "user": {
    "id": "usr_123",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "buyer",
    "emailVerified": false,
    "createdAt": "2025-12-04T10:00:00Z"
  }
}
```

### Login
**POST** `/auth/login`

**Request:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "usr_123",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "buyer",
    "avatar": "https://cdn.builtattic.com/avatars/usr_123.jpg"
  }
}
```

### Logout
**POST** `/auth/logout`

**Headers:** `Authorization: Bearer {token}`

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### Get Current User
**GET** `/auth/me`

**Headers:** `Authorization: Bearer {token}`

**Response:** `200 OK`
```json
{
  "id": "usr_123",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "buyer",
  "avatar": "https://cdn.builtattic.com/avatars/usr_123.jpg",
  "emailVerified": true,
  "createdAt": "2025-12-04T10:00:00Z"
}
```

---

## 🏗️ Design Studio Marketplace

### List Designs
**GET** `/designs`

**Query Parameters:**
```
?category=residential          // Filter by category
&style=modern                 // Filter by style
&price_min=500                // Min price (per sqft)
&price_max=2000               // Max price
&climate=tropical             // Climate adaptability
&plot_area_min=1000           // Min plot area (sqft)
&plot_area_max=5000           // Max plot area
&search=villa                 // Search query
&page=1                       // Page number
&limit=20                     // Items per page
&sort=price_asc               // Sort: price_asc, price_desc, rating_desc, newest
```

**Response:** `200 OK`
```json
{
  "designs": [
    {
      "id": "dsn_123",
      "title": "Modern Villa Design",
      "slug": "modern-villa-design",
      "summary": "Contemporary 3-bedroom villa with open floor plan",
      "category": "Residential",
      "style": "Modern",
      "price": 1250,
      "priceUnit": "per sqft",
      "currency": "USD",
      "plotArea": 3500,
      "builtArea": 2800,
      "bedrooms": 3,
      "bathrooms": 2.5,
      "climate": ["Tropical", "Hot & Humid"],
      "terrain": ["Flat", "Sloping"],
      "heroImage": "https://cdn.builtattic.com/designs/dsn_123/hero.jpg",
      "images": ["..."],
      "rating": 4.8,
      "totalReviews": 24,
      "firm": {
        "id": "firm_456",
        "name": "Studio Mosby",
        "logo": "https://cdn.builtattic.com/firms/firm_456/logo.jpg",
        "location": "Copenhagen, Denmark"
      },
      "createdAt": "2025-11-01T10:00:00Z"
    }
  ],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "totalPages": 8
  }
}
```

### Get Design Details
**GET** `/designs/:id`

**Response:** `200 OK`
```json
{
  "id": "dsn_123",
  "title": "Modern Villa Design",
  "slug": "modern-villa-design",
  "description": "Full description...",
  "summary": "Short summary...",
  "category": "Residential",
  "style": "Modern",
  "price": 1250,
  "priceUnit": "per sqft",
  "currency": "USD",
  "plotArea": 3500,
  "builtArea": 2800,
  "floors": 2,
  "bedrooms": 3,
  "bathrooms": 2.5,
  "climate": ["Tropical", "Hot & Humid"],
  "terrain": ["Flat", "Sloping"],
  "materials": ["Concrete", "Steel", "Glass"],
  "features": ["Balconies", "Skylights", "Green Roof"],
  "heroImage": "https://cdn.builtattic.com/designs/dsn_123/hero.jpg",
  "gallery": ["..."],
  "documents": [
    {
      "type": "floor_plan",
      "name": "Ground Floor Plan",
      "url": "https://cdn.builtattic.com/designs/dsn_123/docs/floor1.pdf"
    }
  ],
  "rating": 4.8,
  "totalReviews": 24,
  "firm": {
    "id": "firm_456",
    "name": "Studio Mosby",
    "bio": "Firm description...",
    "logo": "https://cdn.builtattic.com/firms/firm_456/logo.jpg",
    "location": "Copenhagen, Denmark",
    "founded": 2010,
    "teamSize": 25
  },
  "createdAt": "2025-11-01T10:00:00Z",
  "updatedAt": "2025-11-15T14:30:00Z"
}
```

---

## 👨‍💼 Skill Studio (Associates)

### List Associates
**GET** `/associates`

**Query Parameters:**
```
?skills=revit,autocad         // Filter by skills
&specialization=architecture  // Filter by specialization
&rate_min=50                  // Min hourly rate
&rate_max=200                 // Max hourly rate
&location=uae                 // Location
&experience_min=5             // Min years experience
&search=architect             // Search query
&page=1
&limit=20
```

**Response:** `200 OK`
```json
{
  "associates": [
    {
      "id": "asc_789",
      "name": "Jane Smith",
      "title": "Senior Architect",
      "bio": "Experienced architect specializing in residential projects",
      "avatar": "https://cdn.builtattic.com/associates/asc_789/avatar.jpg",
      "location": "Dubai, UAE",
      "skills": ["Revit", "AutoCAD", "SketchUp"],
      "specializations": ["Architecture", "Interior Design"],
      "hourlyRate": 150,
      "currency": "USD",
      "yearsExperience": 10,
      "projectsCompleted": 45,
      "rating": 4.9,
      "totalReviews": 18,
      "languages": ["English", "Arabic"],
      "availability": "available" | "busy" | "unavailable"
    }
  ],
  "pagination": {
    "total": 85,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
```

### Get Associate Profile
**GET** `/associates/:id`

**Response:** `200 OK`
```json
{
  "id": "asc_789",
  "name": "Jane Smith",
  "title": "Senior Architect",
  "bio": "Full bio...",
  "avatar": "https://cdn.builtattic.com/associates/asc_789/avatar.jpg",
  "heroImage": "https://cdn.builtattic.com/associates/asc_789/hero.jpg",
  "location": "Dubai, UAE",
  "skills": ["Revit", "AutoCAD", "SketchUp", "Lumion"],
  "specializations": ["Architecture", "Interior Design", "3D Visualization"],
  "hourlyRate": 150,
  "currency": "USD",
  "yearsExperience": 10,
  "projectsCompleted": 45,
  "rating": 4.9,
  "totalReviews": 18,
  "languages": ["English", "Arabic"],
  "education": [
    {
      "degree": "Bachelor of Architecture",
      "institution": "MIT",
      "year": 2013
    }
  ],
  "certifications": ["LEED AP", "RIBA Chartered"],
  "portfolio": [
    {
      "id": "prt_123",
      "title": "Luxury Villa Project",
      "description": "Modern villa in Palm Jumeirah",
      "images": ["..."],
      "year": 2024
    }
  ],
  "availability": "available",
  "createdAt": "2025-01-15T10:00:00Z"
}
```

---

## 🏭 Material Studio (Warehouse)

### List Materials
**GET** `/materials`

**Query Parameters:**
```
?category=cement              // Filter by category
&location=uae                 // Vendor location
&min_order_qty=50             // Min order quantity
&price_min=10                 // Min price
&price_max=100                // Max price
&search=portland              // Search query
&page=1
&limit=20
```

**Response:** `200 OK`
```json
{
  "materials": [
    {
      "id": "mat_456",
      "name": "Portland Cement Grade 43",
      "category": "Cement",
      "price": 25,
      "priceUnit": "per bag (50kg)",
      "currency": "USD",
      "minOrderQuantity": 100,
      "stockStatus": "in_stock" | "low_stock" | "out_of_stock",
      "leadTime": "7 days",
      "image": "https://cdn.builtattic.com/materials/mat_456/image.jpg",
      "vendor": {
        "id": "vnd_789",
        "name": "BuildMart Logistics",
        "location": "Dubai, UAE",
        "logo": "https://cdn.builtattic.com/vendors/vnd_789/logo.jpg"
      },
      "specifications": {
        "brand": "UltraTech",
        "weight": "50kg",
        "origin": "UAE"
      },
      "rating": 4.6,
      "totalReviews": 32
    }
  ],
  "pagination": {
    "total": 240,
    "page": 1,
    "limit": 20,
    "totalPages": 12
  }
}
```

### Get Material Details
**GET** `/materials/:id`

**Response:** Similar to list but with full details

---

## 🛒 Shopping Cart

### Get Cart
**GET** `/cart`

**Headers:** `Authorization: Bearer {token}`

**Response:** `200 OK`
```json
{
  "items": [
    {
      "id": "cart_item_123",
      "itemType": "design" | "material" | "service",
      "itemId": "dsn_123",
      "item": {
        "title": "Modern Villa Design",
        "price": 1250,
        "image": "...",
        "firm": {...}
      },
      "quantity": 1,
      "subtotal": 1250,
      "addedAt": "2025-12-04T10:00:00Z"
    }
  ],
  "summary": {
    "subtotal": 1250,
    "tax": 62.5,
    "total": 1312.5,
    "currency": "USD"
  }
}
```

### Add to Cart
**POST** `/cart/items`

**Request:**
```json
{
  "itemType": "design",
  "itemId": "dsn_123",
  "quantity": 1
}
```

**Response:** `201 Created`

### Remove from Cart
**DELETE** `/cart/items/:itemId`

**Response:** `200 OK`

### Clear Cart
**DELETE** `/cart`

**Response:** `200 OK`

---

## 📦 Orders

### Checkout
**POST** `/checkout`

**Request:**
```json
{
  "items": ["cart_item_123", "cart_item_456"],
  "paymentMethod": "card" | "bank_transfer",
  "billingAddress": {...},
  "notes": "Optional notes"
}
```

**Response:** `201 Created`
```json
{
  "orderId": "ord_789",
  "total": 1312.5,
  "currency": "USD",
  "status": "pending",
  "paymentUrl": "https://payment.builtattic.com/ord_789"
}
```

### List Orders
**GET** `/orders`

**Headers:** `Authorization: Bearer {token}`

**Response:** `200 OK`
```json
{
  "orders": [
    {
      "id": "ord_789",
      "orderNumber": "ORD-2025-0001",
      "status": "completed" | "pending" | "cancelled",
      "items": [...],
      "total": 1312.5,
      "currency": "USD",
      "createdAt": "2025-12-04T10:00:00Z"
    }
  ],
  "pagination": {...}
}
```

### Get Order Details
**GET** `/orders/:id`

**Response:** `200 OK` (full order details)

---

## 👤 User Profile

### Get My Profile
**GET** `/users/me`

**Headers:** `Authorization: Bearer {token}`

**Response:** `200 OK`
```json
{
  "id": "usr_123",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "buyer",
  "avatar": "...",
  "phone": "+1234567890",
  "location": "Dubai, UAE",
  "preferences": {
    "currency": "USD",
    "language": "en"
  },
  "createdAt": "2025-12-04T10:00:00Z"
}
```

### Update Profile
**PUT** `/users/me`

**Request:**
```json
{
  "name": "John Updated",
  "phone": "+1234567890",
  "location": "Dubai, UAE"
}
```

**Response:** `200 OK`

### Upload Avatar
**POST** `/users/me/avatar`

**Content-Type:** `multipart/form-data`

**Response:** `200 OK`
```json
{
  "avatar": "https://cdn.builtattic.com/avatars/usr_123.jpg"
}
```

---

## 🎨 Designer Portal

### My Designs
**GET** `/portal/designs`

**Headers:** `Authorization: Bearer {token}`

**Response:** `200 OK` (list of my uploaded designs)

### Upload Design
**POST** `/portal/designs`

**Request:**
```json
{
  "title": "Modern Villa Design",
  "summary": "...",
  "category": "Residential",
  "price": 1250,
  "plotArea": 3500,
  ...
}
```

**Response:** `201 Created`

### Update Design
**PUT** `/portal/designs/:id`

**Response:** `200 OK`

### Delete Design
**DELETE** `/portal/designs/:id`

**Response:** `200 OK`

---

## 💼 Associate Portal

### My Portfolio
**GET** `/portal/portfolio`

**Headers:** `Authorization: Bearer {token}`

**Response:** `200 OK` (my portfolio items)

### Add Portfolio Item
**POST** `/portal/portfolio`

**Request:**
```json
{
  "title": "Luxury Villa Project",
  "description": "...",
  "images": ["..."],
  "year": 2024
}
```

**Response:** `201 Created`

---

## 🏭 Vendor Portal

### My Materials
**GET** `/portal/materials`

**Headers:** `Authorization: Bearer {token}`

**Response:** `200 OK` (list of my materials)

### Add Material
**POST** `/portal/materials`

**Request:**
```json
{
  "name": "Portland Cement",
  "category": "Cement",
  "price": 25,
  "minOrderQuantity": 100,
  ...
}
```

**Response:** `201 Created`

---

## 🔍 Search

### Global Search
**GET** `/search`

**Query Parameters:**
```
?q=modern villa               // Search query
&types=designs,associates     // Filter by types
&page=1
&limit=20
```

**Response:** `200 OK`
```json
{
  "designs": [...],
  "associates": [...],
  "materials": [...],
  "total": 45
}
```

---

## 📊 Error Responses

### Standard Error Format
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": [
      {
        "field": "email",
        "message": "Email is required"
      }
    ]
  }
}
```

### Common Error Codes
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate entry)
- `422` - Unprocessable Entity (business logic error)
- `429` - Too Many Requests (rate limit)
- `500` - Internal Server Error

---

## 🔒 Authentication

All authenticated endpoints require:
```
Authorization: Bearer {jwt_token}
```

JWT payload:
```json
{
  "userId": "usr_123",
  "role": "buyer",
  "iat": 1733312400,
  "exp": 1733398800
}
```

---

## 📝 Notes

1. **Pagination:** All list endpoints support `page` and `limit` query parameters
2. **Sorting:** Use `sort` parameter (e.g., `sort=price_asc`)
3. **Currency:** Defaults to USD, configurable per user
4. **Rate Limiting:** 100 requests per minute per IP
5. **File Uploads:** Max 10MB per file, supported formats: JPG, PNG, PDF
6. **Dates:** All dates in ISO 8601 format (UTC)

---

*API Version: 1.0*
*Last Updated: 2025-12-04*
