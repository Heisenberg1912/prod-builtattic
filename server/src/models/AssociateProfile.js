import mongoose from 'mongoose';

const AssociateProfileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Types.ObjectId, ref: 'User', required: true, unique: true },
    title: String,
    location: String,
    hourlyRate: Number,
    rates: {
      hourly: Number,
      daily: Number,
      currency: { type: String, default: 'USD' },
    },
    availability: String,
    availabilityWindows: [
      {
        day: {
          type: String,
          enum: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
        },
        from: String,
        to: String,
      },
    ],
    timezone: String,
    experienceYears: Number,
    specialisations: [String],
    softwares: [String],
    languages: [String],
    completedProjects: Number,
    heroImage: String,
    profileImage: String,
    contactEmail: String,
    serviceBadges: [String],
    deliverables: [String],
    expertise: [String],
    rating: Number,
    ratingsCount: { type: Number, default: 0 },
    avatar: String,
    summary: String,
    certifications: [String],
    portfolioLinks: [String],
    portfolioMedia: [
      {
        title: String,
        description: String,
        mediaUrl: String,
        kind: String,
      },
    ],
    keyProjects: [
      {
        title: String,
        scope: String,
        year: Number,
        role: String,
      },
    ],
  },
  { timestamps: true }
);

AssociateProfileSchema.index({ specialisations: 1 });
AssociateProfileSchema.index({ location: 1 });
AssociateProfileSchema.index({ timezone: 1 });

export default mongoose.model('AssociateProfile', AssociateProfileSchema);

