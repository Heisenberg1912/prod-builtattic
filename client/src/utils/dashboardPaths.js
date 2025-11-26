export const roleDashboardMap = {
  superadmin: '/dashboard/super-admin',
  admin: '/dashboard/admin',
  vendor: '/dashboard/vendor',
  firm: '/portal/studio',
  associate: '/portal/associate',
  client: '/dashboard/client',
  user: '/dashboard/user',
};

export function fallbackDashboard(role) {
  return roleDashboardMap[role] || '/dashboard';
}
