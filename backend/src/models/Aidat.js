const mongoose = require("mongoose");

const aidatSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true
    },

    amount: {
      type: Number,
      required: true
    },

    apartmentNo: {
      type: Number,
      required: true
    },

    
    dueDate: {
      type: Date,
      required: true
    },

    month: {
      type: Number,
      required: true
    },

    year: {
      type: Number,
      required: true
    },

    paid: {
      type: Boolean,
      default: false
    },

    paidAt: {
      type: Date,
      default: null
    },

    user: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User",
  default: null
    },

paymentRequested: {
      type: Boolean,
      default: false
    },

    paymentRequestedAt: {
      type: Date,
      default: null
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
    
  },
  { timestamps: true }
);

// 🚫 Aynı daireye aynı ay-yıl iki aidat engeli
aidatSchema.index(
  { apartmentNo: 1, month: 1, year: 1 },
  { unique: true }
);

module.exports = mongoose.model("Aidat", aidatSchema);

