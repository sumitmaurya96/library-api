const express = require("express");
const router = express.Router();
const feedbackController = require("../controllers/feedbacks");

/**
 * Get feedback by Id, or email
 */
router.get("/:feedbackId", feedbackController.getFeedbackById);

/**
 * Get all feedback
 * by default sort in decending order by date
 * dateDec=true to sort in ascending order
 * limits to 20 feedback per query for a perticular page
 */
router.get("/library-feedbacks/:query", feedbackController.getFeedbacks);

/**
 * Post
 */
router.post("/", feedbackController.addNewFeedback);

module.exports = router;
