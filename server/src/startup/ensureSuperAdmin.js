import User from "../models/userModel.js";

export async function ensureSuperAdmin() {
  const email = (process.env.SUPER_ADMIN_EMAIL || "superadmin@example.com").toLowerCase();
  const password = process.env.SUPER_ADMIN_PASSWORD || "superadmin@123";
  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({
      fullName: "Super Admin",
      email,
      password,
      role: "superadmin",
    });
    console.log("[INIT] Super admin created:", email);
  } else if (user.role !== "superadmin") {
    user.role = "superadmin";
    await user.save();
    console.log("[INIT] Super admin role enforced for:", email);
  } else {
    console.log("[INIT] Super admin exists:", email);
  }
}
