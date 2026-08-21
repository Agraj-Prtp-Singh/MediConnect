const Appointment = require("../models/Appointment");
const Prescription = require("../models/Prescription");
const Doctor = require("../models/Doctor");
const User = require("../models/User");

const getPatientMedicalHistory = async (req, res) => {
  try {
    const { patientId } = req.params;

    // Verify patient exists
    const patient = await User.findById(patientId).select("name email");

    if (!patient) {
      return res.status(404).json({
        message: "Patient not found",
      });
    }

    // Determine whether the requester is a doctor
    const doctor = await Doctor.findOne({
      user: req.user.id,
      verificationStatus: "approved",
    });

    const isDoctor = !!doctor;

    // Determine whether requester is the patient

    const isPatient = req.user.id.toString() === patientId.toString();

    // Only the patient or an approved doctor
    // can access this information

    if (!isDoctor && !isPatient) {
      return res.status(403).json({
        message:
          "You are not authorized to view this patient's medical history",
      });
    }

    // Get patient's appointments

    const appointments = await Appointment.find({
      patient: patientId,
    })
      .populate({
        path: "doctor",
        populate: {
          path: "user",
          select: "name email",
        },
      })
      .sort({
        date: -1,
        startTime: -1,
      });

    // Get patient's prescription

    const prescriptions = await Prescription.find({
      patient: patientId,
    })
      .populate({
        path: "doctor",
        populate: {
          path: "user",
          select: "name email",
        },
      })
      .populate({
        path: "appointment",
        select: "date startTime endTime status",
      })
      .sort({
        createdAt: -1,
      });

    // Return medical history
    res.status(200).json({
      patient,
      appointments,
      prescriptions,
    });
  } catch (error) {
    console.error("Get patient medical history error:", error);

    res.status(500).json({
      message: "Failed to fetch medical history",
      error: error.message,
    });
  }
};

module.exports = {
  getPatientMedicalHistory,
};
