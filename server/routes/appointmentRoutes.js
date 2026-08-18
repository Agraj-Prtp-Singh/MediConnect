const express = require("express");

const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const {
  getAvailableSlots,
  createAppointment,
  getMyAppointments,
} = require("../controllers/appointmentController");

const router = express.Router();

router.get("/available-slots", protect, getAvailableSlots);

router.post("/", protect, authorize("patient"), createAppointment);
router.get("/my", protect, authorize("patient"), getMyAppointments);

module.exports = router;
