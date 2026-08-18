const express = require("express");

const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const {
  getAvailableSlots,
  createAppointment,
} = require("../controllers/appointmentController");

const router = express.Router();

router.get("/available-slots", protect, getAvailableSlots);

router.post("/", protect, authorize("patient"), createAppointment);

module.exports = router;
