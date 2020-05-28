const express = require("express");
const app = express();
const morgan = require("morgan");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
require("dotenv").config();

//Routes
const bookRoutes = require("./api/routes/books");
const noticeRoutes = require("./api/routes/notices");
const transactionRoutes = require("./api/routes/transactions");
const userRoutes = require("./api/routes/users");
const orderRoutes = require("./api/routes/orders");
const feedbackRoutes = require("./api/routes/feedbacks");

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
      const {
        findUsersByQuery,
        addOneUser,
      } = require("./api/helpers/db-functions/users");

      const errorCb = (err) => {
        console.log(err);
      };

      const getResultCb = (results) => {
        if (results.length) {
          console.log("Admins present, Default admin creation stopped");
        } else {
          const admin = {
            firstname: "admin",
            lastname: "admin",
            username: "admin",
            email: "admin@mail.com",
            role: "admin",
          };

          const adminAddedCb = (adminAddedResult) => {
            console.log({
              message: "Default Admin created",
            });
          };

          addOneUser(
            errorCb,
            adminAddedCb,
            admin,
            process.env.DEFAULT_ADMIN_PASSWORD
          );
        }
      };

      findUsersByQuery(errorCb, getResultCb, null);
    },
    (err) => {
      /** handle initial connection error */
      console.log(err);
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
app.use("/notices", noticeRoutes);
app.use("/transactions", transactionRoutes);
app.use("/users", userRoutes);
app.use("/orders", orderRoutes);
app.use("/feedbacks", feedbackRoutes);
//app.use("/admin", adminRoutes);

//Error handling
//If no routes matches
app.use((req, res, next) => {
  const error = new Error("Route Not Found");
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
