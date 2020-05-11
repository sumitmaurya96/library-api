const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const key = process.env.TOKEN_ENCRYPTION_KEY;
    //varify() will throw en error if token is tempered or invalid
    const decoded = jwt.verify(token, key);
    res.userData = decoded;
    next();
  } catch (error) {
    //If token is invalid or temperd, set userData to null
    res.userData = null;
    next();
  }
};
