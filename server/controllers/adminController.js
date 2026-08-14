const Doctor = require("../models/Doctor");
const User = require("../models/User");

const getPendingDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find({
      verificationStatus: "pending",
    })
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      doctors,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch pending doctors",
    });
  }
};

const approveDoctor = async (req, res) => {
  try {
    const { id } = req.params;

    const doctor = await Doctor.findById(id);

    if (!doctor) {
      return res.status(404).json({
        message: "Doctor application not found",
      });
    }

    if (doctor.verificationStatus !== "pending") {
      return res.status(400).json({
        message: "Doctor application has already been processed",
      });
    }

    const user = await User.findById(doctor.user);

    if (!user) {
      return res.status(404).json({
        message: "Associated user not found",
      });
    }

    doctor.verificationStatus = "approved";
    await doctor.save();

    user.role = "doctor";
    await user.save();

    res.status(200).json({
      message: "Doctor approved successfully",
      doctor,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to approve doctor",
    });
  }
};

const rejectDoctor = async (req, res) => {
  try {
    const { id } = req.params;

    const doctor = await Doctor.findById(id);

    if (!doctor) {
      return res.status(404).json({
        message: "Doctor application not found",
      });
    }

    if (doctor.verificationStatus !== "pending") {
      return res.status(400).json({
        message: "Doctor application has already been processed",
      });
    }

    doctor.verificationStatus = "rejected";
    await doctor.save();

    res.status(200).json({
      message: "Doctor application rejected",
      doctor,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to reject doctor",
    });
  }
};

module.exports = {
  getPendingDoctors,
  approveDoctor,
  rejectDoctor,
};
