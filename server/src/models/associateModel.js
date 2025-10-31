import mongoose from "mongoose";

const associateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    countryCode: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true,
    },
    profilepicture: {
      type: String, // profile picture URL
      default: "",
    },
    student: {
      type: Boolean,
      default: false,
    },
    university: {
      type: String,
      trim: true,
    },
    yearOfEnrollment: {
      type: Number, // YYYY
    },
    collegeId: {
      type: String, // College ID or Alumni ID
      trim: true,
      unique: true,
      sparse: true, // allows multiple null values
    },
    city: {
      type: String,
      trim: true,
    },
    state: {
      type: String,
      trim: true,
    },
    age: {
      type: Number,
      min: 16,
      max: 100,
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
    },
    languages: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  { timestamps: true }
);

const AssociateModel = mongoose.model("Associate", associateSchema);

export default AssociateModel;
