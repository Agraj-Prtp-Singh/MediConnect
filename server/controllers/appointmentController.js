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

        const isBooked = appointments.some(
          (appointment) => appointment.startTime === slotStart,
        );

        slots.push({
          startTime: slotStart,
          endTime: slotEnd,
          available: !isBooked,
        });
      }
    }

    res.status(200).json({
      date,
      slots,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
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

    const availability = await Availability.findOne({
      doctor: doctor._id,
      dayOfWeek,
      isActive: true,
    });

    if (!availability) {
      return res.status(400).json({
        message: "Doctor is not available on this day",
      });
    }

    const requestedStart = timeToMinutes(startTime);
    const requestedEnd = timeToMinutes(endTime);

    const availabilityStart = timeToMinutes(availability.startTime);

    const availabilityEnd = timeToMinutes(availability.endTime);

    if (requestedStart < availabilityStart || requestedEnd > availabilityEnd) {
      return res.status(400).json({
        message: "Requested time is outside doctor's availability",
      });
    }

    if (requestedEnd - requestedStart !== availability.slotDuration) {
      return res.status(400).json({
        message: "Invalid appointment duration",
      });
    }

    if (
      (requestedStart - availabilityStart) % availability.slotDuration !==
      0
    ) {
      return res.status(400).json({
        message: "Invalid appointment slot",
      });
    }

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

    const appointment = await Appointment.create({
      patient: req.user.id,
      doctor: doctor._id,
      date,
      startTime,
      endTime,
      reason,
      consultationFee: doctor.consultationFee,
    });

    res.status(201).json({
      message: "Appointment created successfully",
      appointment,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to create appointment",
    });
  }
};
