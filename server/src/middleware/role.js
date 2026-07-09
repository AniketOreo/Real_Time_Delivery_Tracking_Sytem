function allowRoles(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "You don't have access to this action." });
    }
    next();
  };
}

module.exports = allowRoles;
