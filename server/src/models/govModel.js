import mongoose from "mongoose";

const govSchema = new mongoose.Schema(
  {
    departmentName: {
      type: String,
      required: true,
      trim: true,
    },
    contactPersonName: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true,
    },
    logo: {
      type: String, // URL of Logo / Seal
      default: "",
    },
    city: {
      type: String,
      trim: true,
    },
    state: {
      type: String,
      trim: true,
    },
    govtId: {
      type: String, // Govt ID / Tender ID
      required: true,
      trim: true,
      unique: true,
    },
    address: {
      type: String,
      trim: true,
    },
    bio: {
      type: String, // Bio / Description
      trim: true,
    },
    website: {
      type: String, // Optional Website / Portal
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

const GovModel = mongoose.model("GovModel", govSchema);

export default GovModel;
