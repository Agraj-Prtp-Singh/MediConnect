const createReview = async (req, res) => {
  try {
    const { appointmentId, rating, comment } = req.body;

    // ---------------------------------------------
    // Validate input
    // ---------------------------------------------

    if (!appointmentId || !rating) {
      return res.status(400).json({
        message: "appointmentId and rating are required",
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        message: "Rating must be between 1 and 5",
      });
    }

    // ---------------------------------------------
    // Find appointment belonging to current patient
    // ---------------------------------------------

    const appointment = await Appointment.findOne({
      _id: appointmentId,
      patient: req.user.id,
    });

    if (!appointment) {
      return res.status(404).json({
        message: "Appointment not found",
      });
    }

    // ---------------------------------------------
    // Only completed appointments can be reviewed
    // ---------------------------------------------

    if (appointment.status !== "completed") {
      return res.status(400).json({
        message: "You can only review a completed appointment",
      });
    }

    // ---------------------------------------------
    // Prevent duplicate review
    // ---------------------------------------------

    const existingReview = await Review.findOne({
      appointment: appointment._id,
    });

    if (existingReview) {
      return res.status(400).json({
        message: "You have already reviewed this appointment",
      });
    }

    // ---------------------------------------------
    // Verify doctor exists
    // ---------------------------------------------

    const doctor = await Doctor.findById(appointment.doctor);

    if (!doctor) {
      return res.status(404).json({
        message: "Doctor not found",
      });
    }

    // ---------------------------------------------
    // Create review
    // ---------------------------------------------

    const review = await Review.create({
      doctor: doctor._id,
      patient: req.user.id,
      appointment: appointment._id,
      rating,
      comment,
    });

    // ---------------------------------------------
    // Return created review
    // ---------------------------------------------

    const populatedReview = await Review.findById(review._id).populate(
      "patient",
      "name",
    );

    res.status(201).json({
      message: "Review submitted successfully",
      review: populatedReview,
    });
  } catch (error) {
    console.error("Create review error:", error);

    res.status(500).json({
      message: "Failed to create review",
      error: error.message,
    });
  }
};
