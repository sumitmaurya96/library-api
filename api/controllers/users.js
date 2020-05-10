const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/users");
const Admin = require("../models/admins");

////////////////////////////////////////////////////////// POST //////////////////////////////////////////////////////////
exports.login = (req, res, next) => {
  if (req.body.roles && req.body.roles.length) {
    const Collection = req.body.roles.find((role) => role === "admin")
      ? Admin
      : User;

    Collection.find({ email: req.body.email })
      .exec()
      .then((user) => {
        if (user.length < 1) {
          return res.status(401).json({
            message: "email or password incorrect 1",
          });
        }

        bcrypt.compare(req.body.password, user[0].password, (err, result) => {
          if (err) {
            return res.status(401).json({
              message: "email or password incorrect 2",
            });
          }

          if (result) {
            const key = process.env.TOKEN_ENCRYPTION_KEY;
            const load = {
              roles: user[0].roles,
              email: user[0].email,
              userId: user[0]._id,
            };

            if (req.body.roles.find((role) => role === "admin")) {
              load["isSuperUser"] = user[0].isSuperUser;
            }

            const token = jwt.sign(load, key, {
              expiresIn: "1h",
            });

            res.status(200).json({
              message: "Auth Successful",
              token: token,
            });
          } else {
            res.status(401).json({
              message: "email or password incorrect 3",
            });
          }
        });
      })
      .catch((err) => {
        res.status(500).json({
          error: err,
        });
      });
  } else {
    //Role is not specified
    res.status(409).json({
      message: "role is not specified",
    });
  }
};

exports.addUserOrAdmin = (req, res, next) => {
  //Helper Function to add users/admins
  const add = (roles) => {
    //Set Collection
    const Collection = roles.find((role) => role === "admin") ? Admin : User;

    Collection.find({ email: req.body.email })
      .exec()
      .then((users) => {
        console.log(users);
        if (users.length >= 1) {
          res.status(409).json({
            message: "User Already Exsist",
          });
        } else {
          bcrypt.hash(req.body.password, 10, (err, hash) => {
            if (err) {
              res.status(500).json({
                from: "POST /add",
                error: err,
              });
            } else {
              //roles is expected to be an array
              const user = roles.find((role) => role === "admin")
                ? new Admin({
                    _id: mongoose.Types.ObjectId(),
                    email: req.body.email,
                    password: hash,
                    roles: roles,
                  })
                : new User({
                    _id: mongoose.Types.ObjectId(),
                    cardNumber: req.body.cardNumber,
                    email: req.body.email,
                    password: hash,
                    roles: roles,
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
                    error: err,
                  });
                });
            }
          });
        }
      })
      .catch((err) => {
        res.status(500).json({
          error: err,
        });
      });
  };

  //Only librarian or admin allowed
  if (
    res.userData.roles &&
    !res.userData.roles.find((role) => {
      return role === "admin" || role === "librarian";
    })
  ) {
    return res.status(401).json({
      message: "Un-Authorized",
    });
  }

  //Default student Role
  const roles =
    req.body.roles && req.body.roles.length ? req.body.roles : ["student"];

  if (!res.userData.roles.find((role) => role === "admin")) {
    if (res.userData.isSuperUser) {
      //Super User
      add(roles);
    } else {
      //Normal Admin
      if (req.body.roles.find("admin")) {
        //Cant add admin
        res.status(401).json({
          message: "Un-Authorized",
        });
      } else {
        add(roles);
      }
    }
  } else if (!res.userData.roles.find((role) => role === "librarian")) {
    if (
      req.body.roles.find((role) => {
        return role === "student" || role === "faculty";
      })
    ) {
      add(roles);
    } else {
      //Cant add Others
      res.status(401).json({
        message: "Un-Authorized",
      });
    }
  } else {
    res.status(401).json({
      message: "Un-Authorized",
    });
  }
};

///////////////////////////////////////////////////////////////////////GET////////////////////////////////////////////////////
/**
 * Get All Users
 * Only Admin Can access this
 */
exports.getAllUsers = (req, res, next) => {
  //check if admin
  if (
    !res.userData.roles.find((role) => {
      if (role === "admin") return true;
      return false;
    })
  ) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }

  User.find()
    .exec()
    .then((results) => {
      const resultsOutput = [];
      results.forEach((result, index) => {
        const { password, ...resultWithoutPassword } = result;
        resultsOutput.push(resultWithoutPassword);
      });

      res.status(200).json({
        count: resultsOutput.length,
        users: resultsOutput,
      });
    })
    .catch((err) => {
      res.status(500).json({
        error: err,
      });
    });
};

/**
 * Get user/admin By Id
 * every user/admin can access his/her own record
 * superuser can access anyone's record
 * admin can access all users record but admin
 * librarian can access student and faculty record
 */
exports.getById = (req, res, next) => {
  //Find User By Id in User Collection
  const findOneUser = () => {
    User.findOne({ _id: req.params.userId })
      .exec()
      .then((result) => {
        if (result) {
          const { password, ...resultWithoutPassword } = result._doc;
          return resultWithoutPassword;
        } else {
          res.status(404).json({
            message: "Not Found",
          });
        }
      })
      .catch((err) => {
        res.status(500).json({
          error: err,
        });
      });
  };

  //Find Admin/User function
  const FindingStartFromAdmin = (isSuperUser = false) => {
    Admin.find({ _id: req.params.userId })
      .exec()
      .then((result) => {
        if (result.length) {
          const { password, ...adminWithoutPassword } = result[0];
          if (isSuperUser) {
            return adminWithoutPassword;
          } else {
            if (res.userData.userId === req.params.userId) {
              //Own Id
              return adminWithoutPassword;
            } else {
              res.status(401).json({
                message: "Unauthorized",
              });
            }
          }
        } else {
          return findOneUser();
        }
      })
      .catch((err) => {
        res.status(500).json({
          error: err,
        });
      });
  };

  if (
    res.userData.roles.find((role) => {
      if (role === "admin") return true;
      return false;
    })
  ) {
    let result;
    if (res.userData.isSuperUser) {
      result = FindingStartFromAdmin(true);
    } else {
      result = FindingStartFromAdmin();
    }

    if (result) {
      res.status(200).json({
        ...result,
      });
    }
  } else if (
    res.userData.roles.find((role) => {
      if (role === "librarian") return true;
      return false;
    })
  ) {
    const result = findOneUser();
    if (result.roles.find("librarian")) {
      if (res.userData.userId === req.params.userId) {
        //Own Id
        res.status(200).json({
          ...result,
        });
      } else {
        res.status(401).json({
          message: "Un-Authorized",
        });
      }
    } else {
      res.status(200).json({
        ...result,
      });
    }
  } else {
    if (req.params.userId === res.userData.userId) {
      const result = findOneUser();
      res.status(200).json({
        ...result,
      });
    } else {
      res.status(401).json({
        message: "Unauthorized",
      });
    }
  }
};

//Get all Admins
exports.getAllAdmins = (req, res, next) => {
  //Only Admins
  if (
    !res.userData.roles.find((role) => {
      if (role === "admin") return true;
      return false;
    }) ||
    !res.userData.isSuperUser
  ) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }

  Admin.find()
    .exec()
    .then((results) => {
      //results can't be empty as we are creating a default admin if there is no admin present
      const resultsOutput = [];
      results.forEach((result, index) => {
        const { password, ...resultWithoutPassword } = result;
        resultsOutput.push(resultWithoutPassword);
      });

      res.status(200).json({
        count: resultsOutput.length,
        admins: resultsOutput,
      });
    })
    .catch((err) => {
      res.status(500).json({
        error: err,
      });
    });
};

//////////////////////////////////////////////////////////////UPDATE///////////////////////////////////////////////////
/**
 * superuser can update any user/admin even superuser
 * Student can update itself
 * Faculty can update itself
 * Librarian can update itself, student and faculty (not password)
 * Admin can update all except other admins
 *
 * request Body is an Array
 * [{propName:"password", propValue:"12345678"},{......},{......}]
 */
exports.updateDetails = (req, res, next) => {
  const updateOps = {};
  //req.body is expected to be an array
  for (const ops of req.body) {
    updateOps[ops.propName] = ops.propValue;
  }

  const updateUser = () => {
    User.updateOne({ _id: req.params.userId }, { $set: { ...updateOps } })
      .exec()
      .then((result) => {
        console.log(result);
        if (result.updatedCount) {
          res.status(200).json({
            message: "User/Admin Updated",
          });
        } else {
          res.status(404).json({
            message: "Not Found",
          });
        }
      })
      .catch((err) => {
        res.status(500).json({
          error: err,
        });
      });
  };

  const updateStartFromAdmin = (isSuperUser = false) => {
    const updateHelper = () => {
      Admin.updateOne({ _id: req.params.userId }, { $set: { ...updateOps } })
        .exec()
        .then((result) => {
          console.log(result);
          if (result.updatedCount) {
            res.status(200).json({
              message: "User/Admin Updated",
            });
          } else {
            updateUser();
          }
        })
        .catch((err) => {
          res.status(500).json({
            error: err,
          });
        });
    };

    if (isSuperUser) {
      updateHelper();
    } else {
      Admin.find({ _id: req.params.userId })
        .exec()
        .then((results) => {
          if (results.length) {
            updateUser();
          } else {
            if (
              results[0].roles.find("admin") &&
              req.body.userId !== res.userData.userId
            ) {
              res.status(401).json({
                message: "Un-Authorized",
              });
            } else {
              updateHelper();
            }
          }
        })
        .catch((err) => {
          res.status(500).json({
            error: err,
          });
        });
    }
  };

  //Role is not defined
  if (!res.userData.roles && !res.userData.roles.length) {
    return res.status(409).json({
      message: "Role must be specified",
    });
  }

  if (res.userData.roles.find((role) => role === "admin")) {
    //if superuser
    if (res.userData.isSuperUser) {
      updateStartFromAdmin(true);
    } else {
      updateStartFromAdmin();
    }
  } else if (res.userData.roles.find((role) => role === "librarian")) {
    User.find({ _id: req.params.userId })
      .exec()
      .then((results) => {
        if (results.length) {
          res.status(404).json({
            message: "Not found",
          });
        } else {
          if (
            results[0].roles.find((role) => {
              return role === "admin";
            })
          ) {
            res.status(401).json({
              message: "Un-Authorized",
            });
          } else if (
            results[0].roles.find((role) => {
              return role === "librarian";
            })
          ) {
            if (res.userData.userId === req.params.userId) {
              updateUser();
            } else {
              res.status(401).json({
                message: "Un-Authorized",
              });
            }
          } else {
            updateUser();
          }
        }
      })
      .catch((err) => {
        res.status(500).json({
          error: err,
        });
      });
  } else {
    if (res.userData.userId === req.params.userId) {
      updateUser();
    }
  }
};

///////////////////////////////////////////////////////////////////DELETE///////////////////////////////////////////////////////
/**
 * superuser can delete any user/admin even superuser
 * Student can delete itself
 * Faculty can delete itself
 * Librarian can delete itself, student and faculty
 * Admin can delete all except other admins
 */
exports.deleteById = (req, res, next) => {
  const deleter = (Collection) => {
    Collection.deleteOne({ _id: req.params.userId })
      .exec()
      .then((result) => {
        console.log(result);
        if (result.deletedCount) {
          res.status(200).json({
            message: "User/Admin Deleted",
          });
          return 1;
        } else {
          return 0;
        }
      })
      .catch((err) => {
        return -1;
      });
  };

  //Role is not defined
  if (!res.userData.roles && !res.userData.roles.length) {
    return res.status(500).json({
      message: "User Role must be specified",
    });
  }

  if (res.userData.roles.find((role) => role === "admin")) {
    //if superuser
    if (res.userData.isSuperUser) {
      let isDeleted = deleter(Admin);
      if (isDeleted === 0) {
        isDeleted = deleter(User);
        if (isDeleted === 0) {
          res.status(404).json({
            message: "No User/Admin found",
          });
        }
        if (isDeleted === -1) {
          res.status(500).json({
            error: err,
          });
        }
      }

      if (isDeleted === -1) {
        isDeleted = deleter(User);
        if (isDeleted === -1 || isDeleted === 0) {
          res.status(500).json({
            error: err,
          });
        }
      }
    } else {
      Admin.find({ _id: req.params.userId })
        .exec()
        .then((result) => {
          if (result.length) {
            if (req.params.userId === res.userData.userId) {
              if (deleter(Admin) === -1) {
                res.status(500).json({
                  error: err,
                });
              }
            } else {
              res.status(401).json({ message: "Can't delete another admin" });
            }
          } else {
            const status = deleter(User);
            if (status === 0) {
              res.status(404).json({
                message: "No User found",
              });
            }
            if (status === -1) {
              res.status(500).json({
                error: err,
              });
            }
          }
        })
        .catch((err) => {
          return res.status(500).json({
            error: err,
          });
        });
    }
  } else {
    if (res.userData.userId === req.params.userId) {
      const status = deleter(User);
      if (status === 0) {
        res.status(404).json({
          message: "No User found",
        });
      }
      if (status === -1) {
        res.status(500).json({
          error: err,
        });
      }
    } else {
      res.status(401).json({
        message: "Unauthorized",
      });
    }
  }
};

/////////////////////////////////////////////////////////////SUPER USER ///////////////////////////////////////////////////
const superUserHelper = (req, res, flag) => {
  /**
   * update isSuperUser to true/false
   */
  if (flag && !res.userData.roles && !res.userData.roles.find("admin")) {
    return res.status(401).json({
      message: "Un-authenticated",
    });
  }

  const key = flag ? req.body.key : process.env.SUPERUSER_KEY;
  if (key && key === process.env.SUPERUSER_KEY) {
    Admin.updateOne(
      { _id: res.userData.userId },
      { $set: { isSuperUser: flag } }
    )
      .exec()
      .then((result) => {
        if (result.nModified) {
          res.status(200).json({
            message: "Success",
          });
        } else {
          res.status(404).json({
            message: "Faild",
          });
        }
      })
      .catch((err) => {
        res.status(500).json({ error: err });
      });
  } else {
    res.status(401).json({
      message: "wrong key",
    });
  }
};

exports.superUserLogin = (req, res, next) => {
  const flag = true;
  superUserHelper(req, res, flag);
};

exports.superUserLogOut = (req, res, next) => {
  const flag = false;
  superUserHelper(req, res, flag);
};
