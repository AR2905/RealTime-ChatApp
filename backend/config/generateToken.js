const jwt = require("jsonwebtoken");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SEC, {
    expiresIn: "30d",
  });
};

module.exports = generateToken;
