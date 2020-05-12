const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/users");
const Admin = require("../models/admins");
const { admin, librarian, faculty, student } = require("../roles-config/roles");

////////////////////////////////////////////////////////// POST //////////////////////////////////////////////////////////
exports.loginUser = (req, res, next) => {
  if (req.body.role) {
    const Collection = req.body.role === "admin" ? Admin : User;

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
              role: user[0].role,
              email: user[0].email,
              userId: user[0]._id,
            };

            // if (req.body.role === "admin") {
            //   load["isSuperUser"] = user[0].isSuperUser;
            // }

            try {
              const token = jwt.sign(load, key, {
                expiresIn: "1h",
              });

              res.status(200).json({
                message: "Auth Successful",
                token: token,
              });
            } catch (err) {
              res.status(401).json({
                message: err,
              });
            }
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
  const add = (role) => {
    //Set Collection
    const Collection = role === "admin" ? Admin : User;

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
              const user =
                role === "admin"
                  ? new Admin({
                      _id: mongoose.Types.ObjectId(),
                      email: req.body.email,
                      password: hash,
                      role: role,
                    })
                  : role === "student"
                  ? new User({
                      _id: mongoose.Types.ObjectId(),
                      cardNumber: req.body.cardNumber,
                      email: req.body.email,
                      password: hash,
                      role: role,
                    })
                  : new User({
                      _id: mongoose.Types.ObjectId(),
                      cardNumber: req.body.email,
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
                    message: "aaaakjkg",
                    error: err,
                  });
                });
            }
          });
        }
      })
      .catch((err) => {
        res.status(500).json({
          message: "fagkjkg",
          error: err,
        });
      });
  };

  //Only librarian and admin allowed
  if (res.userData.role !== "admin" && res.userData.role !== "librarian") {
    return res.status(401).json({
      message: "Un-Authorized",
    });
  }

  //Default student Role
  const role = req.body.role ? req.body.role : "student";
  //check if it is a valid role
  if (
    role !== admin.id &&
    role !== librarian.id &&
    role !== faculty.id &&
    role !== student.id
  ) {
    return res.status(400).json({
      message: "Not a valid role",
    });
  }

  if (res.userData.role === "admin") {
    if (res.userData.isSuperUser) {
      //Super User
      add(role);
    } else {
      //Normal Admin
      if (req.body.role === "admin") {
        //Cant add admin
        res.status(401).json({
          message: "An admin(not superuser) cant add another admin",
        });
      } else {
        add(role);
      }
    }
  } else if (res.userData.role === "librarian") {
    if (req.body.role === "student" || req.body.role === "faculty") {
      add(role);
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
  if (res.userData.role === "admin") {
    User.find()
      .exec()
      .then((results) => {
        res.status(200).json({
          count: results.length,
          users: results.map((result) => {
            const { password, ...resultWithoutPassword } = result._doc;
            return resultWithoutPassword;
          }),
        });
      })
      .catch((err) => {
        res.status(500).json({
          error: err,
        });
      });
  } else {
    res.status(401).json({
      message: "Unauthorized",
    });
  }
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
  const findOneUser = (cb) => {
    User.findOne({ _id: req.params.userId })
      .exec()
      .then((result) => {
        if (result) {
          const { password, ...resultWithoutPassword } = result._doc;
          //a librarian cant access another librarian data but can access faculty, student data
          if (res.userData.role === "librarian") {
            if (res.userData.userId === req.params.userId) {
              cb(resultWithoutPassword);
            } else {
              res.status(401).json({
                message: "Un-Authorized",
              });
            }
          } else {
            cb(resultWithoutPassword);
          }
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
  const FindingStartFromAdmin = (isSuperUser, cb) => {
    Admin.find({ _id: req.params.userId })
      .exec()
      .then((result) => {
        if (result.length) {
          const { password, ...adminWithoutPassword } = result[0];
          if (isSuperUser) {
            cb(adminWithoutPassword);
          } else {
            if (res.userData.userId === req.params.userId) {
              //Own Id
              cb(adminWithoutPassword);
            } else {
              res.status(401).json({
                message: "Unauthorized",
              });
            }
          }
        } else {
          findOneUser(cb);
        }
      })
      .catch((err) => {
        res.status(500).json({
          error: err,
        });
      });
  };

  if (res.userData.role === "admin") {
    const cb = (result) => {
      res.status(200).json(result);
    };

    if (res.userData.isSuperUser) {
      FindingStartFromAdmin(true, cb);
    } else {
      FindingStartFromAdmin(false, cb);
    }
  } else if (res.userData.role === "librarian") {
    const cb = (result) => {
      res.status(200).json(result);
    };
    findOneUser(cb);
  } else {
    //console.log(res.userData);
    if (req.params.userId === res.userData.userId) {
      const cb = (result) => {
        res.status(200).json(result);
      };

      findOneUser(cb);
    } else {
      res.status(401).json({
        message: "Unauthorized",
      });
    }
  }
};

/**
 * Get all admins data
 * only admin(superuser) can access
 */
exports.getAllAdmins = (req, res, next) => {
  //Only Admins
  if (!res.userData.role === "admin" || !res.userData.isSuperUser) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }

  Admin.find()
    .exec()
    .then((results) => {
      //results can't be empty as we are creating a default admin if there is no admin present
      res.status(200).json({
        count: results.length,
        admins: results.map((result) => {
          const { password, ...resultWithoutPassword } = result._doc;
          return resultWithoutPassword;
        }),
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
 * Librarian can update itself, student and faculty
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
            message: "User Updated",
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
              message: "Admin Updated",
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
            if (req.params.userId !== res.userData.userId) {
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
  if (!res.userData.role) {
    return res.status(409).json({
      message: "Role must be specified",
    });
  }

  if (res.userData.role === "admin") {
    //if superuser
    if (res.userData.isSuperUser) {
      updateStartFromAdmin(true);
    } else {
      updateStartFromAdmin();
    }
  } else if (res.userData.role === "librarian") {
    User.find({ _id: req.params.userId })
      .exec()
      .then((results) => {
        if (results.length) {
          res.status(404).json({
            message: "Not found",
          });
        } else {
          if (results[0].role === "admin") {
            res.status(401).json({
              message: "Un-Authorized",
            });
          } else if (results[0].role === "librarian") {
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
  const deleteUser = () => {
    User.deleteOne({ _id: req.params.userId })
      .exec()
      .then((result) => {
        console.log(result);
        if (result.deletedCount) {
          res.status(200).json({
            message: "User Deleted",
          });
        } else {
          res.status(404).json({
            message: "Not found",
          });
        }
      })
      .catch((err) => {
        res.status(500).json({
          error: err,
        });
      });
  };

  const deleteStartFromAdmin = () => {
    Admin.deleteOne({ _id: req.params.userId })
      .exec()
      .then((result) => {
        console.log(result);
        if (result.deletedCount) {
          res.status(200).json({
            message: "Admin Deleted",
          });
        } else {
          deleteUser();
        }
      })
      .catch((err) => {
        res.status(500).json({
          error: err,
        });
      });
  };

  //Role is not defined
  if (!res.userData.role) {
    return res.status(400).json({
      message: "Role must be specified",
    });
  }

  if (res.userData.role === "admin") {
    //if superuser
    if (res.userData.isSuperUser) {
      deleteStartFromAdmin();
    } else {
      Admin.find({ _id: req.params.userId })
        .exec()
        .then((result) => {
          if (result.length) {
            if (req.params.userId === res.userData.userId) {
              deleteStartFromAdmin();
            } else {
              res.status(401).json({ message: "Can't delete another admin" });
            }
          } else {
            deleteUser();
          }
        })
        .catch((err) => {
          return res.status(500).json({
            error: err,
          });
        });
    }
  } else if (res.userData.role === "librarian") {
    User.findOne({ _id: req.params.userId })
      .exec()
      .then((result) => {
        if (result) {
          if (result.role === "librarian") {
            if (req.params.userId === res.userData.userId) {
              deleteUser();
            } else {
              res
                .status(401)
                .json({ message: "Can't delete another librarian" });
            }
          } else {
            deleteUser();
          }
        } else {
          res.status(404).json({
            message: "No User found",
          });
        }
      })
      .catch((err) => {
        return res.status(500).json({
          error: err,
        });
      });
  } else {
    if (res.userData.userId === req.params.userId) {
      deleteUser();
    }
  }
};
