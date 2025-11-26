import mongoose from 'mongoose';

const AssociateProfileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Types.ObjectId, ref: 'User', required: true, unique: true },
    fullName: { type: String, trim: true },
    firmName: { type: String, trim: true },
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
    coverImage: String,
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
    toolset: [String],
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
    workHistory: [
      {
        company: String,
        role: String,
        duration: String,
        summary: String,
      },
    ],
    registrationId: { type: String, trim: true },
    verificationDoc: { type: String, trim: true },
    firmType: { type: String, trim: true },
    teamSize: Number,
    primaryCategories: [String],
    primaryStyles: [String],
    avgDesignRate: Number,
    servicesOffered: [String],
    portfolioLink: { type: String, trim: true },
    portfolioUpload: { type: String, trim: true },
    contact: {
      email: String,
      phone: String,
      website: String,
      calendly: String,
    },
    serviceBundle: String,
    workingDrawings: String,
    servicePack: String,
    schedulingMeeting: String,
  },
  { timestamps: true }
);

AssociateProfileSchema.index({ specialisations: 1 });
AssociateProfileSchema.index({ location: 1 });
AssociateProfileSchema.index({ timezone: 1 });

export default mongoose.model('AssociateProfile', AssociateProfileSchema);
