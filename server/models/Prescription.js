const mongoose = require("mongoose");

const medicineSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    dosage: {
      type: String,
      required: true,
      trim: true,
    },

    frequency: {
      type: String,
      required: true,
      trim: true,
    },

    duration: {
      type: String,
      required: true,
      trim: true,
    },

    instructions: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    _id: false,
  },
);

const prescriptionSchema = new mongoose.Schema(
  {
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      required: true,
      unique: true,
      index: true,
    },

    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
      index: true,
    },

    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    diagnosis: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },

    medicines: {
      type: [medicineSchema],
      default: [],
    },

    notes: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

prescriptionSchema.index({
  patient: 1,
  createdAt: -1,
});

prescriptionSchema.index({
  doctor: 1,
  createdAt: -1,
});

module.exports = mongoose.model("Prescription", prescriptionSchema);
