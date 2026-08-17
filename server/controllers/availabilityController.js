const Availability = require("../models/Availability");
const Doctor = require("../models/Doctor");

const createAvailability = async (req, res) => {
  try {
    const { dayOfWeek, startTime, endTime, slotDuration } = req.body;

    const doctor = await Doctor.findOne({
      user: req.user.id,
      verificationStatus: "approved",
    });

    if (!doctor) {
      return res.status(404).json({
        message: "Approved doctor profile not found",
      });
    }

    if (startTime >= endTime) {
      return res.status(400).json({
        message: "End time must be after start time",
      });
    }

    const existingAvailability = await Availability.findOne({
      doctor: doctor._id,
      dayOfWeek,
      isActive: true,
    });

    if (existingAvailability) {
      return res.status(400).json({
        message: "Availability already exists for this day",
      });
    }

    const availability = await Availability.create({
      doctor: doctor._id,
      dayOfWeek,
      startTime,
      endTime,
      slotDuration,
    });

    res.status(201).json({
      message: "Availability created successfully",
      availability,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create availability",
    });
  }
};

module.exports = {
  createAvailability,
};
