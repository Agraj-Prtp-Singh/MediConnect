const express = require("express");

const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const {
  createReview,
  getDoctorReviews,
  getMyReviews,
} = require("../controllers/reviewController");

const router = express.Router();

// Patient creates a review
router.post("/", protect, authorize("patient"), createReview);

// Publicly accessible doctor reviews
router.get("/doctor/:doctorId", getDoctorReviews);

// Patient's own reviews
router.get("/my", protect, authorize("patient"), getMyReviews);

module.exports = router;
