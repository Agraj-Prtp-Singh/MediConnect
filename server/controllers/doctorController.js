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

const getDoctors = async (req, res) => {
  try {
    const { specialty, search } = req.query;

    const filter = {
      verificationStatus: "approved",
    };

    if (specialty) {
      filter.specialty = specialty;
    }

    let doctors = await Doctor.find(filter)
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    if (search) {
      const searchTerm = search.toLowerCase();

      doctors = doctors.filter((doctor) =>
        doctor.user.name.toLowerCase().includes(searchTerm),
      );
    }

    res.status(200).json({
      doctors,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch doctors",
    });
  }
};

const getDoctorById = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({
      _id: req.params.id,
      verificationStatus: "approved",
    }).populate("user", "name email");

    if (!doctor) {
      return res.status(404).json({
        message: "Doctor not found",
      });
    }

    res.status(200).json({
      doctor,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch doctor",
    });
  }
};

module.exports = {
  applyAsDoctor,
  getDoctors,
  getDoctorById,
};
