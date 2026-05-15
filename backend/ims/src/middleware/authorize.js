const { ROLES } = require("../utils/permissions");

const authorizeRoles = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: "Forbidden: role not allowed" });
  }
  return next();
};

const authorizePermissions = (...permissions) => (req, res, next) => {
  if (req.user.role === ROLES.ADMIN) {
    return next();
  }

  const granted = req.user.permissions || [];
  const hasAll = permissions.every((permission) => granted.includes(permission));

  if (!hasAll) {
    return res.status(403).json({ message: "Forbidden: permission denied" });
  }

  return next();
};

module.exports = {
  authorizeRoles,
  authorizePermissions
};
