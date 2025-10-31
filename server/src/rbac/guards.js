import mongoose from 'mongoose';

export function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ ok:false, error:'Unauthorized' });
  next();
}

export function requireGlobal(...roles) {
  return (req,res,next) => {
    const normalized = roles.map(r => String(r).toLowerCase());
    const userRole = String(req.user?.role || '').toLowerCase();
    if (normalized.includes(userRole)) return next();
    const has = (req.user?.rolesGlobal || []).some(r => normalized.includes(String(r).toLowerCase()));
    if (!has) return res.status(403).json({ ok:false, error:'Forbidden (global)' });
    next();
  };
}

export function requireFirmRole(...roles){
  return (req,res,next) => {
    // Bypass if global admin/superadmin
    const role = String(req.user?.role || '').toLowerCase();
    if (role === 'superadmin' || role === 'admin') return next();
    if ((req.user?.rolesGlobal || []).some(r => r === 'superadmin' || r === 'admin')) {
      return next();
    }
    const firmId = req.params.firmId || req.body.firmId || req.query.firmId;
    if (!firmId || !mongoose.isValidObjectId(firmId)) {
      return res.status(400).json({ ok:false, error:'firmId required' });
    }
    const required = roles.map(r => String(r).toLowerCase());
    const m = (req.user?.memberships || []).find(m => String(m.firm) === String(firmId));
    if (!m || !required.includes(String(m.role).toLowerCase())) {
      return res.status(403).json({ ok:false, error:'Forbidden (firm)' });
    }
    next();
  };
}
