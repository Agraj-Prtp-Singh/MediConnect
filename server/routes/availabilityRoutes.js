const express = require("express");

const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const {
  createAvailability,
  getMyAvailability,
} = require("../controllers/availabilityController");

const router = express.Router();

router.post("/", protect, authorize("doctor"), createAvailability);
router.get("/my", protect, authorize("doctor"), getMyAvailability);

module.exports = router;
