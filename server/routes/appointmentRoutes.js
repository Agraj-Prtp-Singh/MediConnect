const express = require("express");

const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const {
  getAvailableSlots,
  createAppointment,
  getMyAppointments,
  getDoctorAppointments,
  confirmAppointment,
  completeAppointment,
} = require("../controllers/appointmentController");

const router = express.Router();

router.get("/available-slots", protect, getAvailableSlots);

router.post("/", protect, authorize("patient"), createAppointment);
router.get("/my", protect, authorize("patient"), getMyAppointments);
router.get("/doctor", protect, authorize("doctor"), getDoctorAppointments);
router.patch("/:id/confirm", protect, authorize("doctor"), confirmAppointment);
router.patch(
  "/:id/complete",
  protect,
  authorize("doctor"),
  completeAppointment,
);

module.exports = router;
