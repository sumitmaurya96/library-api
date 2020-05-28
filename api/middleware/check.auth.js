const jwt = require("jsonwebtoken");
const { contains } = require("../helpers/algorithms");

//User Schema
const User = require("../models/users");

module.exports = (roles) => {
  return (req, res, next) => {
    try {
      const token = req.headers.authorization.split(" ")[1];
      const key = process.env.TOKEN_ENCRYPTION_KEY;
      const { sub } = jwt.verify(token, key);

      User.findById(sub)
        .exec()
        .then((user) => {
          if (user) {
            if (contains.call(roles, user.role)) {
              res.userData = user;
              console.log(user);
              next();
            } else {
              res.status(401).json({
                message: "Unauthorized",
              });
            }
          } else {
            res.status(404).json({
              message: "User deleted recently",
            });
          }
        })
        .catch((err) => {
          res.status(500).json({
            error: err,
          });
        });
    } catch (error) {
      res.status(401).json({
        message: "Authorization Faild While Varifying Token",
      });
    }
  };
};
