const express = require("express");

const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const {
  createPrescription,
  getMyPrescriptions,
  getPrescriptionById,
} = require("../controllers/prescriptionController");

const router = express.Router();

router.post("/", protect, authorize("doctor"), createPrescription);

router.get("/my", protect, authorize("patient"), getMyPrescriptions);

router.get("/:id", protect, getPrescriptionById);

module.exports = router;
