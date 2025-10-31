import mongoose from "mongoose";

const archFirmSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    logo: {
      type: String, // URL for firm logo
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
    avgDesignCostSqft: {
      type: Number,
      min: 0,
    },
    primaryCategory: {
      type: String, // e.g. Residential, Commercial
      trim: true,
    },
    primaryStyle: {
      type: String, // e.g. Modernism, Gothic
      trim: true,
    },
    foundedIn: {
      type: Number, // year
    },
    headArchitect: {
      type: String,
      trim: true,
    },
    license: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    bio: {
      type: String,
      trim: true,
    },
    cover: {
      type: String, // URL for cover image
      default: "",
    },
    website: {
      type: String,
      trim: true,
    },

    // Admin / POC (Point of Contact)
    admin: {
      name: {
        type: String,
        trim: true,
      },
      email: {
        type: String,
        lowercase: true,
        trim: true,
      },
      phone: {
        type: String,
        trim: true,
      },
    },
  },
  { timestamps: true }
);

const ArchFirm = mongoose.model("ArchFirm", archFirmSchema);

export default ArchFirm;
