# 🎨 shadcn/ui Quick Reference Card

## Common Patterns & Examples

### 🔘 Buttons

```jsx
import { Button } from "./components/ui/button";

// Variants
<Button variant="default">Default</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Outline</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>

// Sizes
<Button size="default">Default</Button>
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
<Button size="icon"><Icon /></Button>

// With icons
<Button>
  <Upload size={16} />
  Upload
</Button>

// Disabled
<Button disabled>Disabled</Button>

// Custom styling
<Button className="w-full">Full Width</Button>
```

---

### 📇 Cards

```jsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "./components/ui/card";

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description text</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Card content goes here</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

---

### 📝 Form Fields

```jsx
import { Input } from "./components/ui/input";
import { Textarea } from "./components/ui/textarea";
import { Label } from "./components/ui/label";
import { FormField } from "./components/forms/FormField";

// Basic input
<div className="space-y-2">
  <Label htmlFor="email">Email</Label>
  <Input id="email" type="email" placeholder="you@example.com" />
</div>

// Using FormField wrapper
<FormField label="Email" hint="We'll never share your email" required>
  <Input type="email" placeholder="you@example.com" />
</FormField>

// Textarea
<FormField label="Bio" hint="Tell us about yourself">
  <Textarea placeholder="I am a..." rows={4} />
</FormField>

// With error
<FormField label="Password" error="Password must be at least 8 characters">
  <Input type="password" />
</FormField>
```

---

### 🖼️ Image Upload

```jsx
import { ImageUploader } from "./components/forms/ImageUploader";

const [avatar, setAvatar] = useState(null);

<ImageUploader
  value={avatar}
  onChange={setAvatar}
  label="Upload Profile Picture"
  maxSize={5 * 1024 * 1024} // 5MB
/>
```

---

### 🏷️ Badges

```jsx
import { Badge } from "./components/ui/badge";

<Badge variant="default">Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="destructive">Destructive</Badge>
<Badge variant="outline">Outline</Badge>

// Custom color
<Badge className="bg-green-500 text-white">Active</Badge>
```

---

### 📐 Layouts

```jsx
import { MainLayout } from "./components/layouts/MainLayout";
import { PortalLayout } from "./components/layouts/PortalLayout";
import { WorkspaceLayout } from "./components/layouts/WorkspaceLayout";

// Main layout (with nav + footer)
function HomePage() {
  return (
    <MainLayout>
      <h1>Page content</h1>
    </MainLayout>
  );
}

// Portal layout (with sidebar)
function StudioPortal() {
  return (
    <PortalLayout sidebar={<Sidebar />}>
      <h1>Portal content</h1>
    </PortalLayout>
  );
}

// Workspace layout (full screen)
function Workspace() {
  return (
    <WorkspaceLayout header={<Toolbar />}>
      <h1>Workspace content</h1>
    </WorkspaceLayout>
  );
}
```

---

### 📋 Form Sections

```jsx
import { FormSection } from "./components/forms/FormSection";
import { FormField } from "./components/forms/FormField";
import { Input } from "./components/ui/input";

<FormSection
  title="Profile Information"
  description="Update your personal details"
>
  <FormField label="Full Name" required>
    <Input placeholder="John Doe" />
  </FormField>

  <FormField label="Email" required>
    <Input type="email" placeholder="john@example.com" />
  </FormField>

  <FormField label="Phone" hint="Include country code">
    <Input type="tel" placeholder="+1 234 567 8900" />
  </FormField>
</FormSection>
```

---

### 🔀 Conditional Styling (cn utility)

```jsx
import { cn } from "./lib/utils";

// Conditional classes
<div className={cn(
  "base-class",
  isActive && "active-class",
  isDisabled && "disabled-class"
)} />

// With object syntax
<div className={cn(
  "base-class",
  {
    "active-class": isActive,
    "disabled-class": isDisabled
  }
)} />

// Merging conflicting Tailwind classes
<div className={cn(
  "p-4 bg-red-500", // Base classes
  "p-8 bg-blue-500"  // Overrides → final: p-8 bg-blue-500
)} />
```

---

### ➗ Separators

```jsx
import { Separator } from "./components/ui/separator";

// Horizontal (default)
<div>
  <h1>Title</h1>
  <Separator className="my-4" />
  <p>Content</p>
</div>

// Vertical
<div className="flex h-20">
  <div>Left</div>
  <Separator orientation="vertical" className="mx-4" />
  <div>Right</div>
</div>
```

---

## 🎨 Common Design Patterns

### Two-Column Form Layout

```jsx
<FormSection title="Contact Information">
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <FormField label="First Name">
      <Input />
    </FormField>
    <FormField label="Last Name">
      <Input />
    </FormField>
  </div>
</FormSection>
```

### Action Bar with Buttons

```jsx
<div className="flex items-center justify-between">
  <h2 className="text-lg font-semibold">Studios</h2>
  <div className="flex gap-2">
    <Button variant="outline">Cancel</Button>
    <Button>Save Changes</Button>
  </div>
</div>
```

### Card Grid

```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {items.map((item) => (
    <Card key={item.id}>
      <CardHeader>
        <CardTitle>{item.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>{item.description}</p>
      </CardContent>
    </Card>
  ))}
</div>
```

### Loading State

```jsx
import { Button } from "./components/ui/button";

const [loading, setLoading] = useState(false);

<Button disabled={loading}>
  {loading ? "Loading..." : "Submit"}
</Button>
```

### Empty State

```jsx
<Card>
  <CardContent className="py-12 text-center">
    <FileText className="mx-auto mb-4 text-slate-400" size={48} />
    <h3 className="text-lg font-semibold mb-2">No items found</h3>
    <p className="text-sm text-slate-500 mb-4">
      Get started by creating your first item
    </p>
    <Button>Create Item</Button>
  </CardContent>
</Card>
```

---

## 🎯 Migration Patterns

### Before → After Examples

#### Custom Button → Button Component

```jsx
// ❌ Before
<button
  onClick={handleClick}
  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
>
  Click me
</button>

// ✅ After
<Button onClick={handleClick}>
  Click me
</Button>
```

#### Custom Card → Card Component

```jsx
// ❌ Before
<div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
  <h3 className="text-lg font-semibold text-slate-900">Title</h3>
  <p className="text-sm text-slate-500">Description</p>
  <div className="mt-4">
    {/* content */}
  </div>
</div>

// ✅ After
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    {/* content */}
  </CardContent>
</Card>
```

#### Custom Input → Input Component

```jsx
// ❌ Before
<input
  type="text"
  value={value}
  onChange={onChange}
  placeholder="Enter text"
  className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
/>

// ✅ After
<Input
  value={value}
  onChange={onChange}
  placeholder="Enter text"
/>
```

#### Manual Form Field → FormField Component

```jsx
// ❌ Before (28 lines repeated)
<label className="flex flex-col gap-2">
  <span className="text-sm font-medium text-slate-700">
    Email Address
    <span className="text-red-500 ml-1">*</span>
  </span>
  <input
    type="email"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
  />
  {error ? (
    <p className="text-xs text-red-500">{error}</p>
  ) : (
    <p className="text-xs text-slate-500">We'll never share your email</p>
  )}
</label>

// ✅ After (7 lines)
<FormField
  label="Email Address"
  hint="We'll never share your email"
  error={error}
  required
>
  <Input
    type="email"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
  />
</FormField>
```

---

## 🚀 Pro Tips

### 1. Use the `cn` utility for dynamic classes
```jsx
// Instead of string concatenation
className={`base ${isActive ? 'active' : ''} ${size}`}

// Use cn
className={cn("base", isActive && "active", size)}
```

### 2. Extend components with custom variants
```jsx
// In your component file
const myButtonVariants = cva(buttonVariants, {
  variants: {
    custom: {
      gradient: "bg-gradient-to-r from-blue-500 to-purple-500",
    }
  }
});

<Button variant="gradient">Gradient Button</Button>
```

### 3. Compose components
```jsx
// Build complex UIs from simple primitives
function ProfileCard({ user }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-4">
          <img src={user.avatar} className="h-12 w-12 rounded-full" />
          <div>
            <CardTitle>{user.name}</CardTitle>
            <CardDescription>{user.role}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p>{user.bio}</p>
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full">
          View Profile
        </Button>
      </CardFooter>
    </Card>
  );
}
```

---

## 📦 Component Checklist

When migrating a component:

- [ ] Replace custom buttons with `<Button>`
- [ ] Replace custom cards with `<Card>`
- [ ] Replace custom inputs with `<Input>` / `<Textarea>`
- [ ] Wrap form fields in `<FormField>`
- [ ] Group related fields in `<FormSection>`
- [ ] Use `<Badge>` for status indicators
- [ ] Use `<Separator>` instead of `<hr>` or border divs
- [ ] Use layout components instead of custom wrappers
- [ ] Use `cn()` for conditional classes
- [ ] Remove duplicated Tailwind class definitions

---

## 🎨 Color Reference

```jsx
// Text Colors
text-slate-900  // Primary text
text-slate-700  // Secondary text
text-slate-500  // Tertiary text / hints
text-slate-400  // Placeholder text

// Background Colors
bg-white        // Card backgrounds
bg-slate-50     // Page backgrounds
bg-slate-100    // Secondary backgrounds
bg-slate-900    // Primary button background

// Border Colors
border-slate-200  // Default borders
border-slate-300  // Hover borders
border-slate-400  // Focus borders

// Status Colors
text-red-500      // Errors
text-green-500    // Success
text-yellow-500   // Warnings
text-blue-500     // Info
```

---

**Need more components?** Run: `npx shadcn@latest add [component-name]`

Check available components: https://ui.shadcn.com/docs/components
