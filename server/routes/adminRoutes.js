const express = require("express");

const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const {
  getPendingDoctors,
  approveDoctor,
  rejectDoctor,
} = require("../controllers/adminController");

const router = express.Router();

router.get("/doctors/pending", protect, authorize("admin"), getPendingDoctors);

router.patch(
  "/doctors/:id/approve",
  protect,
  authorize("admin"),
  approveDoctor,
);

router.patch("/doctors/:id/reject", protect, authorize("admin"), rejectDoctor);

module.exports = router;
