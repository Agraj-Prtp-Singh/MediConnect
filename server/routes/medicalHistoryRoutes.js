const express = require("express");

const protect = require("../middleware/authMiddleware");

const {
  getPatientMedicalHistory,
} = require("../controllers/medicalHistoryController");

const router = express.Router();

router.get("/:patientId", protect, getPatientMedicalHistory);

module.exports = router;
