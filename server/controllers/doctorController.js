const Doctor = require("../models/Doctor");
const User = require("../models/User");

const applyAsDoctor = async (req, res) => {
  try {
    const {
      specialty,
      qualification,
      experience,
      consultationFee,
      bio,
      clinic,
      profileImage,
    } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (user.role !== "patient") {
      return res.status(400).json({
        message: "Only patients can apply as doctors",
      });
    }

    const existingDoctor = await Doctor.findOne({
      user: req.user.id,
    });

    if (existingDoctor) {
      return res.status(400).json({
        message: "Doctor application already exists",
      });
    }

    const doctor = await Doctor.create({
      user: req.user.id,
      specialty,
      qualification,
      experience,
      consultationFee,
      bio,
      clinic,
      profileImage,
    });

    res.status(201).json({
      message: "Doctor application submitted successfully",
      doctor,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

module.exports = {
  applyAsDoctor,
};
