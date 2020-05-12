const express = require("express");
const app = express();
const morgan = require("morgan");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
require("dotenv").config();

//Routes
const bookRoutes = require("./api/routes/books");
const orderRoutes = require("./api/routes/orders");
const userRoutes = require("./api/routes/person/users");
const adminRoutes = require("./api/routes/person/admins");

//Connect Database
mongoose
  .connect(process.env.DB_LINK, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  })
  .then(
    () => {
      //Create default Admin if no admin is present already
      const Admin = require("./api/models/admins");
      Admin.find()
        .exec()
        .then((admins) => {
          if (!admins.length) {
            require("bcrypt").hash(
              process.env.DEFAULT_ADMIN_PASSWORD,
              10,
              (err, hash) => {
                if (err) {
                  console.log({
                    from: "Error in Default Admin creation",
                    error: err,
                  });
                } else {
                  const admin = new Admin({
                    _id: mongoose.Types.ObjectId(),
                    email: "admin@mail.com",
                    password: hash,
                  });
                  admin
                    .save()
                    .then()
                    .catch((err) => {
                      console.log({
                        from: "Error in Default Admin creation",
                        error: err,
                      });
                    });
                }
              }
            );
          }
        })
        .catch((err) => {
          console.log({
            from: "Error in Default Admin creation",
            error: err,
          });
        });
    },
    (err) => {
      /** handle initial connection error */
      console.log(err);
      res.status(500).json({
        message: "can't connect to database",
      });
    }
  );

mongoose.Promise = global.Promise;

//MiddleWare
app.use(morgan("dev"));
app.use("/uploads", express.static("uploads"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//Resolving cors error
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );

  if (req.method === "OPTIONS") {
    res.header("Access-Control-Allow-Methods", "GET, PUT, POST, PATCH, DELETE");
    return res.status(200).json({});
  }
  next();
});

//Route middleware
app.use("/books", bookRoutes);
app.use("/orders", orderRoutes);
app.use("/user", userRoutes);
app.use("/admin", adminRoutes);

//Error handling
//If no routes matches
app.use((req, res, next) => {
  const error = new Error("Not Found");
  error.status = 404;
  //forward
  next(error);
});

//catch every error
app.use((error, req, res, next) => {
  res.status(error.status || 500);
  res.json({
    error: {
      message: error.message,
    },
  });
});

module.exports = app;
