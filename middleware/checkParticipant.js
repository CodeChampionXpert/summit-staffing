const checkParticipant = (req, res, next) => {
  if (!req.user || req.user.role !== 'participant') {
    return res.status(403).json({ ok: false, error: 'Forbidden' });
  }

  return next();
};

module.exports = checkParticipant;
