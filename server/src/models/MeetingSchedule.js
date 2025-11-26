import mongoose from 'mongoose';

const { Schema } = mongoose;

const AttendeeSchema = new Schema(
  {
    name: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      trim: true,
    },
  },
  { _id: false },
);

const MeetingScheduleSchema = new Schema(
  {
    ownerType: {
      type: String,
      enum: ['associate', 'firm'],
      required: true,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    agenda: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    scheduledFor: {
      type: Date,
      required: true,
    },
    durationMinutes: {
      type: Number,
      default: 30,
    },
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled'],
      default: 'scheduled',
    },
    type: {
      type: String,
      enum: ['consultation', 'review', 'handover', 'site', 'check-in', 'other'],
      default: 'consultation',
    },
    location: {
      type: String,
      trim: true,
    },
    meetingLink: {
      type: String,
      trim: true,
    },
    recordingUrl: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    attendees: {
      type: [AttendeeSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

MeetingScheduleSchema.index({ ownerId: 1, scheduledFor: 1 });
MeetingScheduleSchema.index({ ownerType: 1, status: 1 });
MeetingScheduleSchema.index({ ownerType: 1, type: 1, scheduledFor: 1 });

export default mongoose.model('MeetingSchedule', MeetingScheduleSchema);
