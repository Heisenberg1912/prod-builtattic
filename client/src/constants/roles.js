export const roleAliases = {
  business: "client",
  company: "firm",
  vendor: "vendor",
  firmadmin: "firm",
  government: "client",
  govt: "client",
  super_admin: "superadmin",
  owner: "vendor",
  customer: "client",
  assoc: "associate",
  sale: "vendor",
  salesperson: "vendor",
};

// Dashboards have been removed; send every role to the home page.
export const roleDashboardPath = {
  superadmin: "/",
  admin: "/",
  user: "/",
  associate: "/",
  firm: "/",
  client: "/",
  vendor: "/",
};

export const normalizeRole = (role) => {
  const value = String(role || "").trim().toLowerCase();
  if (!value) return "user";
  if (roleAliases[value]) return roleAliases[value];
  return value;
};

export const resolveDashboardPath = (role) =>
  roleDashboardPath[normalizeRole(role)] || "/";

export const inferRoleFromUser = (user) => {
  if (!user) return "user";
  if (user.role) return normalizeRole(user.role);
  const globals = user.rolesGlobal || [];
  if (globals.includes("superadmin")) return "superadmin";
  if (globals.includes("admin")) return "admin";
  const membershipRole = user.memberships?.[0]?.role;
  if (membershipRole === "owner") return "vendor";
  if (membershipRole === "admin") return "firm";
  if (membershipRole === "associate") return "associate";
  return user.isClient === false ? "user" : "client";
};
