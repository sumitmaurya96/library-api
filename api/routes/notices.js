const express = require("express");
const router = express.Router();
const checkAuth = require("../middleware/check.auth");
const noticeController = require("../controllers/notices");

const { admin, librarian } = require("../roles/roles");

/**
 * Get notices by Id
 */
router.get("/:noticeId", noticeController.getNoticeById);

/**
 * Get all notices
 * by default sort in decending order by date
 * dateDec=true to sort in ascending order
 * limits to 20 notices per query for a perticular page
 */
router.get("/library-notices/:query", noticeController.getNotices);

/**
 * Only Librarian and admin can access
 */
router.post("/", checkAuth([admin, librarian]), noticeController.addNewNotice);

/**
 * Only Librarian and admin can access
 */
router.patch(
  "/:noticeId",
  checkAuth([admin, librarian]),
  noticeController.updateNotice
);

/**
 * Only Librarian and admin can access
 */
router.delete(
  "/:noticeId",
  checkAuth([admin, librarian]),
  noticeController.deleteNotice
);

module.exports = router;
