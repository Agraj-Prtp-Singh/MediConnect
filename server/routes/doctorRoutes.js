const express = require("express");

const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const { applyAsDoctor } = require("../controllers/doctorController");

const router = express.Router();

router.post("/apply", protect, authorize("patient"), applyAsDoctor);

module.exports = router;
