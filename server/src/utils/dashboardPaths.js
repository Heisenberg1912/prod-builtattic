export const roleDashboardMap = {
  superadmin: '/dashboard/super-admin',
  admin: '/dashboard/admin',
  vendor: '/dashboard/vendor',
  firm: '/dashboard/firm',
  associate: '/dashboard/associate',
  client: '/dashboard/client',
  user: '/dashboard/user'
};

export function getDashboardPath(role) {
  const key = typeof role === 'string' ? role.toLowerCase() : '';
  return roleDashboardMap[key] || '/dashboard';
}
