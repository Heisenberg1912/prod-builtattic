import mongoose from "mongoose";

const MattersWeatherSchema = new mongoose.Schema(
  {
    mode: { type: String, required: true, unique: true, lowercase: true, trim: true },
    location: String,
    temperature: Number,
    condition: String,
    humidity: Number,
    wind: Number,
    precipitation: Number,
    units: { type: String, default: 'metric' },
    observedAt: String,
  },
  { timestamps: true }
);

export default mongoose.models.MattersWeather ||
  mongoose.model("MattersWeather", MattersWeatherSchema);
