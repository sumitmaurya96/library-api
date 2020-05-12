const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const queryString = require("query-string");

//Roles
const { admin } = require("../../roles-config/roles");

/**
 * Helper functions
 */
const {
  findOneAdmin,
  findAdminsByQuery,
  updateOneAdmin,
  deleteOneAdmin,
} = require("../../helpers/admins");

/**
 * Admin. Login
 */
exports.loginAdmin = (req, res, next) => {
  const errorCb = (err) => {
    res.status(500).json({ error: err });
  };

  const getResultCb = (result) => {
    if (result) {
      bcrypt.compare(
        req.body.password,
        result.password,
        (err, decryptedRes) => {
          if (err) {
            return res.status(401).json({
              message: "email or password incorrect",
            });
          } else if (decryptedRes) {
            const key = process.env.TOKEN_ENCRYPTION_KEY;
            const load = {
              role: result.role,
              email: result.email,
              id: result._id,
            };

            const token = jwt.sign(load, key, {
              expiresIn: "1h",
            });

            res.status(200).json({
              message: "Auth Successful",
              token: token,
            });
          } else {
            res.status(401).json({
              message: "email or password incorrect",
            });
          }
        }
      );
    } else {
      res.status(401).json({
        message: "email or password incorrect",
      });
    }
  };

  const query = {
    email: req.body.email,
  };

  findOneAdmin(errorCb, getResultCb, query);
};

/**
 * update isSuperUser to true/false
 */
const superUserHelper = (req, res, flag) => {
  if (res.userData.role !== admin.id) {
    res.status(401).json({
      message: "Unauthorized",
    });
  } else {
    const key = flag ? req.body.key : process.env.SUPERUSER_KEY;

    if (key && key === process.env.SUPERUSER_KEY) {
      const errorCb = (err) => {
        res.status(500).json({ error: err });
      };

      const getResultCb = () => {
        if (result.nModified) {
          res.status(200).json({
            message: "Successful",
          });
        } else {
          res.status(409).json({
            message: "Action Already Executed",
          });
        }
      };

      const updateProps = {
        isSuperUser: flag,
      };

      updateOneAdmin(
        errorCb,
        getResultCb,
        { _id: res.userData.id },
        updateProps
      );
    } else {
      res.status(401).json({
        message: "wrong key",
      });
    }
  }
};

/**
 * login as superuser
 * only admin can login
 * sets isSuperUser to true
 */
exports.superUserLogin = (req, res, next) => {
  const flag = true;
  superUserHelper(req, res, flag);
};

/**
 * logout from superuser
 * sets isSuperUser to false
 */
exports.superUserLogOut = (req, res, next) => {
  const flag = false;
  superUserHelper(req, res, flag);
};

/**
 * Add New Admin
 * Only Super User can add admin
 */
exports.addAdmin = (req, res, next) => {
  if (res.userData.role === admin.id) {
    const errorCb = (err) => {
      res.status(500).json({ error: err });
    };

    const getResultCb = (result) => {
      if (result) {
        res.status(409).json({ message: "Already Exsist" });
      } else {
        if (res.userData.isSuperUser) {
          bcrypt.hash(req.body.password, 10, (err, hash) => {
            if (err) {
              res.status(500).json({ from: "POST /add", error: err });
            } else {
              const user = new Admin({
                _id: mongoose.Types.ObjectId(),
                email: req.body.email,
                password: hash,
                role: role,
              });

              user
                .save()
                .then((result) => {
                  res.status(201).json({
                    message: "Success",
                  });
                })
                .catch((err) => {
                  res.status(500).json({
                    message: "Error While adding admin",
                    error: err,
                  });
                });
            }
          });
        } else {
          res.status(401).json({ message: "You Are Not a Super User" });
        }
      }
    };

    findOneAdmin(errorCb, getResultCb, { _id: req.body.id });
  } else {
    const err = {
      message: "Unauthorized",
    };
    res.status(401).json({ error: err });
  }
};

/**
 * Upadate Admin
 * admin can update itself
 * superuser can update all admins
 */

exports.updateAdmin = (req, res, next) => {
  if (res.userData.role === admin.id) {
    const updateOps = {};
    //req.body is expected to be an array
    for (const ops of req.body) {
      if (
        ops.propName !== "isSuperUser" &&
        ops.propName !== "email" &&
        ops.propName !== "_id"
      ) {
        updateOps[ops.propName] = ops.propValue;
      }
    }

    const errorCb = (err) => {
      res.status(500).json({
        error: err,
      });
    };

    const adminCb = (adminDetails) => {
      if (adminDetails) {
        const updateCallBack = (result) => {
          if (result.nModified) {
            res.status(200).json({
              message: "Successful",
            });
          } else {
            res.status(409).json({
              message: "Action Already Executed",
            });
          }
        };

        if (adminDetails.isSuperUser) {
          updateOneAdmin(errorCb, updateCallBack, updateOps);
        } else {
          if (res.userData.id === req.params.id) {
            updateOneAdmin(errorCb, updateCallBack, updateOps);
          } else {
            res.status(401).json({
              message: "Unauthorized",
            });
          }
        }
      } else {
        res.status(401).json({
          message: "Unauthorized",
        });
      }
    };

    //Check if requesting user is superuser or not
    findOneAdmin(errorCb, adminCb, { _id: res.userData.id });
  } else {
    res.status(401).json({
      message: "Unauthorized",
    });
  }
};

/**
 * Delete Admin
 * admin can delete itself
 * superuser can delete all admins
 */

exports.deleteAdmin = (req, res, next) => {
  if (res.userData.role === admin.id) {
    const errorCb = (err) => {
      res.status(500).json({
        error: err,
      });
    };

    const adminCb = (adminDetails) => {
      if (adminDetails) {
        const deleteCallBack = (result) => {
          if (result.deletedCount) {
            res.status(200).json({
              message: "Successful",
            });
          } else {
            res.status(404).json({
              message: "Not Found",
            });
          }
        };

        if (adminDetails.isSuperUser) {
          deleteOneAdmin(errorCb, deleteCallBack, { _id: req.params.id });
        } else {
          if (res.userData.id === req.params.id) {
            deleteOneAdmin(errorCb, deleteCallBack, { _id: req.params.id });
          } else {
            res.status(401).json({
              message: "Unauthorized",
            });
          }
        }
      } else {
        res.status(401).json({
          message: "Unauthorized",
        });
      }
    };

    //Check if requesting user is superuser or not
    findOneAdmin(errorCb, adminCb, { _id: res.userData.id });
  } else {
    res.status(401).json({
      message: "Unauthorized",
    });
  }
};

/**
 * Get Admin by Id
 * Any admin can access its own data
 * Superuser can access any admins data
 */
exports.getAdminById = (req, res, next) => {
  if (res.userData.role === admin.id) {
    const errorCb = (err) => {
      res.status(500).json({
        error: err,
      });
    };

    const adminCb = (adminDetails) => {
      if (adminDetails) {
        const findCallBack = (result) => {
          if (result) {
            const { password, ...resultWithoutPassword } = result;
            res.status(200).json({
              ...resultWithoutPassword,
            });
          } else {
            res.status(404).json({
              message: "Not Found",
            });
          }
        };

        if (adminDetails.isSuperUser) {
          findOneAdmin(errorCb, findCallBack, { _id: req.params.id });
        } else {
          if (res.userData.id === req.params.id) {
            findOneAdmin(errorCb, findCallBack, { _id: req.params.id });
          } else {
            res.status(401).json({
              message: "Unauthorized",
            });
          }
        }
      } else {
        res.status(401).json({
          message: "Unauthorized",
        });
      }
    };

    //Check if requesting user is superuser or not
    findOneAdmin(errorCb, adminCb, { _id: res.userData.id });
  } else {
    res.status(401).json({
      message: "Unauthorized",
    });
  }
};

/**
 * Get Admins by query
 * Only superUser Are allowed
 */
exports.getAdmins = (req, res, next) => {
  if (res.userData.role === admin.id) {
    /**
     * Parse Query string and convert it to object
     * This will be a mongoDB query
     * so super user can give any query
     */
    const query = queryString.parse(res.params.query);

    const errorCb = (err) => {
      res.status(500).json({
        error: err,
      });
    };

    const adminCb = (adminDetails) => {
      if (adminDetails) {
        const findCallBack = (results) => {
          res.status(200).json({
            count: results.length,
            admins: results.map((result) => {
              const { password, ...resultWithoutPassword } = result._doc;
              return resultWithoutPassword;
            }),
          });
        };

        if (adminDetails.isSuperUser) {
          findAdminsByQuery(errorCb, findCallBack, query);
        } else {
          res.status(401).json({
            message: "Unauthorized",
          });
        }
      } else {
        //Requesting admin is not found in db
        res.status(401).json({
          message: "Unauthorized",
        });
      }
    };

    //Check if requesting user is superuser or not
    findOneAdmin(errorCb, adminCb, { _id: res.userData.id });
  } else {
    res.status(401).json({
      message: "Unauthorized",
    });
  }
};
