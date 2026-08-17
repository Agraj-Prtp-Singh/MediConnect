const express = require("express");

const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const { createAvailability } = require("../controllers/availabilityController");

const router = express.Router();

router.post("/", protect, authorize("doctor"), createAvailability);

module.exports = router;
