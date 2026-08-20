const Prescription = require("../models/Prescription");
const Appointment = require("../models/Appointment");
const Doctor = require("../models/Doctor");

const createPrescription = async (req, res) => {
  try {
    const { appointmentId, diagnosis, medicines, notes } = req.body;

    if (!appointmentId || !diagnosis) {
      return res.status(404).json({
        message: "appointmentId and diagnosis are required",
      });
    }

    const doctor = await Doctor.findOne({
      user: req.user.id,
      verificationStatus: "approved",
    });

    if (!doctor) {
      return res.status(404).json({
        message: "Approved Doctor profile not found",
      });
    }

    const appointment = await Appointment.find({
      _id: appointmentId,
      doctor: doctor._id,
    });

    if (!appointment) {
      return res.status(404).json({
        message: "Appointment Not Found",
      });
    }

    if (appointment.status !== "completed") {
      return res.status(400).json({
        message: "Prescription can only be created for completed appointments",
      });
    }

    const exixstingPrescription = await Prescription.findOne({
      appointment: appointment._id,
    });

    if (exixstingPrescription) {
      return res.status(400).json({
        message: "A prescription already exists for this appointment",
      });
    }

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
    console.error();

    res.status(500).json({
      message: "Failed to create prescription",
    });
  }
};

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
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch prescriptions",
    });
  }
};

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

    const doctor = await Doctor.findOne({
      user: req.user.id,
    });

    const isPatient = prescription.patient._id.toString() === req.user.id;

    const isDoctor =
      doctor && prescription.doctor._id.toString() === doctor._id.toString();

    if (!isPatient && !isDoctor) {
      return res.status(403).json({
        message: "You are not authorized to view this prescription",
      });
    }

    res.status(200).json({
      prescription,
    });
  } catch (error) {
    console.error(error);

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
