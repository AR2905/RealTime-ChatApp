const publicUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  isVerified: user.isVerified,
  isAdmin: user.isAdmin,
  pic: user.pic,
  online: user.online,
  lastSeen: user.lastSeen,
  authProvider: user.authProvider,
  blocked: (user.blocked || []).map((b) => b.toString()),
});

module.exports = { publicUser };