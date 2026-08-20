const Prescription = require("../models/Prescription");
const Appointment = require("../models/Appointment");
const Doctor = require("../models/Doctor");

// CREATE PRESCRIPTION
// Doctor can create a prescription only for their
// own completed appointment.

const createPrescription = async (req, res) => {
  try {
    const { appointmentId, diagnosis, medicines, notes } = req.body;

    // Validate required fields
    if (!appointmentId || !diagnosis) {
      return res.status(400).json({
        message: "appointmentId and diagnosis are required",
      });
    }

    // Find the authenticated doctor's Doctor profile
    const doctor = await Doctor.findOne({
      user: req.user.id,
      verificationStatus: "approved",
    });

    if (!doctor) {
      return res.status(404).json({
        message: "Approved doctor profile not found",
      });
    }

    // Find the appointment AND make sure it belongs
    // to the authenticated doctor
    const appointment = await Appointment.findOne({
      _id: appointmentId,
      doctor: doctor._id,
    });

    if (!appointment) {
      return res.status(404).json({
        message: "Appointment not found",
      });
    }

    // Prescription can only be created after
    // the consultation is completed
    if (appointment.status !== "completed") {
      return res.status(400).json({
        message: "Prescription can only be created for completed appointments",
      });
    }

    // Prevent multiple prescriptions for one appointment
    const existingPrescription = await Prescription.findOne({
      appointment: appointment._id,
    });

    if (existingPrescription) {
      return res.status(400).json({
        message: "A prescription already exists for this appointment",
      });
    }

    // Create prescription
    const prescription = await Prescription.create({
      appointment: appointment._id,
      doctor: doctor._id,
      patient: appointment.patient,
      diagnosis,
      medicines,
      notes,
    });

    res.status(201).json({
      message: "Prescription created successfully",
      prescription,
    });
  } catch (error) {
    console.error("Create prescription error:", error);

    res.status(500).json({
      message: "Failed to create prescription",
      error: error.message,
    });
  }
};

// GET MY PRESCRIPTIONS
// Patient can view all of their prescriptions.

const getMyPrescriptions = async (req, res) => {
  try {
    const prescriptions = await Prescription.find({
      patient: req.user.id,
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

    res.status(200).json({
      prescriptions,
    });
  } catch (error) {
    console.error("Get my prescriptions error:", error);

    res.status(500).json({
      message: "Failed to fetch prescriptions",
    });
  }
};

// GET PRESCRIPTION BY ID
// Only the patient who owns it OR the doctor who created
// it can view the prescription.

const getPrescriptionById = async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate({
        path: "doctor",
        populate: {
          path: "user",
          select: "name email",
        },
      })
      .populate({
        path: "patient",
        select: "name email",
      })
      .populate({
        path: "appointment",
        select: "date startTime endTime status",
      });

    if (!prescription) {
      return res.status(404).json({
        message: "Prescription not found",
      });
    }

    // Check whether authenticated user is the patient
    const isPatient = prescription.patient._id.toString() === req.user.id;

    // Check whether authenticated user is the doctor
    const doctor = await Doctor.findOne({
      user: req.user.id,
    });

    const isDoctor =
      doctor && prescription.doctor._id.toString() === doctor._id.toString();

    // User must be either the patient or the doctor
    if (!isPatient && !isDoctor) {
      return res.status(403).json({
        message: "You are not authorized to view this prescription",
      });
    }

    res.status(200).json({
      prescription,
    });
  } catch (error) {
    console.error("Get prescription by ID error:", error);

    res.status(500).json({
      message: "Failed to fetch prescription",
    });
  }
};

module.exports = {
  createPrescription,
  getMyPrescriptions,
  getPrescriptionById,
};
