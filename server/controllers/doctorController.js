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

    return res.status(201).json({
      message: "Doctor application submitted successfully",
      doctor,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

const getDoctors = async (req, res) => {
  try {
    const { specialty, search, page = 1, limit = 10 } = req.query;

    const currentPage = Math.max(Number(page), 1);
    const pageLimit = Math.min(Math.max(Number(limit), 1), 50);

    const skip = (currentPage - 1) * pageLimit;

    const doctorFilter = {
      verificationStatus: "approved",
    };

    // Filter by specialty
    if (specialty) {
      doctorFilter.specialty = {
        $regex: specialty,
        $options: "i",
      };
    }

    // Search by doctor's name
    if (search) {
      const users = await User.find({
        name: {
          $regex: search,
          $options: "i",
        },
      }).select("_id");

      const userIds = users.map((user) => user._id);

      doctorFilter.user = {
        $in: userIds,
      };
    }

    const [doctors, totalDoctors] = await Promise.all([
      Doctor.find(doctorFilter)
        .populate("user", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageLimit),

      Doctor.countDocuments(doctorFilter),
    ]);

    return res.status(200).json({
      doctors,
      pagination: {
        page: currentPage,
        limit: pageLimit,
        total: totalDoctors,
        totalPages: Math.ceil(totalDoctors / pageLimit),
      },
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
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

    return res.status(200).json({
      doctor,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Failed to fetch doctor",
    });
  }
};

module.exports = {
  applyAsDoctor,
  getDoctors,
  getDoctorById,
};
