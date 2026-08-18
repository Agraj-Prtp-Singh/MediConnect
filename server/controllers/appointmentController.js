const Appointment = require("../models/Appointment");
const Doctor = require("../models/Doctor");
const Availability = require("../models/Availability");

const timeToMinutes = (time) => {
  const [hours, minutes] = time.split(":").map(Number);

  return hours * 60 + minutes;
};

const minutesToTime = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
};

const getAvailableSlots = async (req, res) => {
  try {
    const { doctorId, date } = req.query;

    if (!doctorId || !date) {
      return res.status(400).json({
        message: "doctorId and date are required",
      });
    }

    const doctor = await Doctor.findOne({
      _id: doctorId,
      verificationStatus: "approved",
    });

    if (!doctor) {
      return res.status(404).json({
        message: "Doctor not found",
      });
    }

    const selectedDate = new Date(`${date}T00:00:00`);

    if (Number.isNaN(selectedDate.getTime())) {
      return res.status(400).json({
        message: "Invalid date",
      });
    }

    const dayOfWeek = selectedDate.getDay();

    const availability = await Availability.find({
      doctor: doctor._id,
      dayOfWeek,
      isActive: true,
    });

    if (availability.length === 0) {
      return res.status(200).json({
        date,
        slots: [],
      });
    }

    const appointments = await Appointment.find({
      doctor: doctor._id,
      date,
      status: {
        $in: ["pending", "confirmed"],
      },
    });

    const slots = [];

    for (const schedule of availability) {
      const start = timeToMinutes(schedule.startTime);
      const end = timeToMinutes(schedule.endTime);

      for (
        let current = start;
        current + schedule.slotDuration <= end;
        current += schedule.slotDuration
      ) {
        const slotStart = minutesToTime(current);
        const slotEnd = minutesToTime(current + schedule.slotDuration);

        const isBooked = appointments.some((appointment) => {
          const appointmentStart = timeToMinutes(appointment.startTime);

          const appointmentEnd = timeToMinutes(appointment.endTime);

          return (
            appointmentStart < current + schedule.slotDuration &&
            appointmentEnd > current
          );
        });

        slots.push({
          startTime: slotStart,
          endTime: slotEnd,
          available: !isBooked,
        });
      }
    }

    return res.status(200).json({
      date,
      slots,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Failed to fetch available slots",
    });
  }
};

const createAppointment = async (req, res) => {
  try {
    const { doctorId, date, startTime, endTime, reason } = req.body;

    if (!doctorId || !date || !startTime || !endTime) {
      return res.status(400).json({
        message: "doctorId, date, startTime and endTime are required",
      });
    }

    const doctor = await Doctor.findOne({
      _id: doctorId,
      verificationStatus: "approved",
    });

    if (!doctor) {
      return res.status(404).json({
        message: "Doctor not found",
      });
    }

    const selectedDate = new Date(`${date}T00:00:00`);

    if (Number.isNaN(selectedDate.getTime())) {
      return res.status(400).json({
        message: "Invalid date",
      });
    }

    const dayOfWeek = selectedDate.getDay();

    // Find ALL availability schedules for this day
    const availability = await Availability.find({
      doctor: doctor._id,
      dayOfWeek,
      isActive: true,
    });

    if (availability.length === 0) {
      return res.status(400).json({
        message: "Doctor is not available on this day",
      });
    }

    const requestedStart = timeToMinutes(startTime);
    const requestedEnd = timeToMinutes(endTime);

    if (requestedEnd <= requestedStart) {
      return res.status(400).json({
        message: "Invalid appointment time",
      });
    }

    // Check whether the requested slot belongs to
    // any of the doctor's availability schedules
    const matchingSchedule = availability.find((schedule) => {
      const availabilityStart = timeToMinutes(schedule.startTime);

      const availabilityEnd = timeToMinutes(schedule.endTime);

      const slotDuration = schedule.slotDuration;

      return (
        requestedStart >= availabilityStart &&
        requestedEnd <= availabilityEnd &&
        requestedEnd - requestedStart === slotDuration &&
        (requestedStart - availabilityStart) % slotDuration === 0
      );
    });

    if (!matchingSchedule) {
      return res.status(400).json({
        message: "Invalid appointment slot",
      });
    }

    // Check if the requested slot is already booked
    const existingAppointment = await Appointment.findOne({
      doctor: doctor._id,
      date,
      startTime,
      status: {
        $in: ["pending", "confirmed"],
      },
    });

    if (existingAppointment) {
      return res.status(409).json({
        message: "This appointment slot is already booked",
      });
    }

    const bookingKey = `${doctor._id}_${date}_${startTime}`;

    try {
      const appointment = await Appointment.create({
        patient: req.user.id,
        doctor: doctor._id,
        date,
        startTime,
        endTime,
        bookingKey,
        reason,
        consultationFee: doctor.consultationFee,
      });

      return res.status(201).json({
        message: "Appointment created successfully",
        appointment,
      });
    } catch (error) {
      // Handles duplicate bookingKey
      if (error.code === 11000) {
        return res.status(409).json({
          message: "This appointment slot was just booked by another patient",
        });
      }

      throw error;
    }
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Failed to create appointment",
    });
  }
};

const getMyAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({
      patient: req.user.id,
    })
      .populate({
        path: "doctor",
        populate: {
          path: "user",
          select: "name email",
        },
      })
      .sort({
        date: 1,
        startTime: 1,
      });

    res.status(200).json({
      appointments,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch appointments",
    });
  }
};

const getDoctorAppointments = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({
      user: req.user.id,
      verificationStatus: "approved",
    });

    if (!doctor) {
      return res.status(404).json({
        message: "Approved doctor profile not found",
      });
    }

    const appointments = await Appointment.find({
      doctor: doctor._id,
    })
      .populate("patient", "name email")
      .sort({
        date: 1,
        startTime: 1,
      });

    res.status(200).json({
      appointments,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch doctor appointments",
    });
  }
};

module.exports = {
  getAvailableSlots,
  createAppointment,
  getMyAppointments,
  getDoctorAppointments,
};
