const { VerifyToken } = require("../config/Token");

const CheckForAuthentication = (cookieName) => {
  return (req, res, next) => {
    const TokenValue = req.cookies[cookieName];

    if (!TokenValue) {
      // If no token is found, you might want to handle this differently
      // For example, you could respond with an unauthorized status
      return next()
    }

    try {
      const Payload = VerifyToken(TokenValue);
      req.user = Payload;
      next(); // Call next if authentication succeeds
    } catch (error) {
      // If an error occurs during token verification, you might want to handle it
      // For example, you could respond with an error status  
      
      return res.status(500).send("Internal Server Error");
    }
  };
};

module.exports = { CheckForAuthentication };
