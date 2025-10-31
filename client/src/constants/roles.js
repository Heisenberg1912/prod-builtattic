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

export const roleDashboardPath = {
  superadmin: "/dashboard/super-admin",
  admin: "/dashboard/admin",
  user: "/dashboard/user",
  associate: "/dashboard/associate",
  firm: "/dashboard/firm",
  client: "/dashboard/client",
  vendor: "/dashboard/vendor",
};

export const normalizeRole = (role) => {
  const value = String(role || "").trim().toLowerCase();
  if (!value) return "user";
  if (roleAliases[value]) return roleAliases[value];
  return value;
};

export const resolveDashboardPath = (role) =>
  roleDashboardPath[normalizeRole(role)] || "/dashboard/user";

