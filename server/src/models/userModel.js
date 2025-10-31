import mongoose from "mongoose";
import bcrypt from "bcryptjs"; // changed from `bcrypt` to `bcryptjs`

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    fullName: {
      type: String,
      required: true, // fixed
    },
    email: {
      type: String,
      required: true, // fixed
      unique: true,
      lowercase: true,
      index: true,
    },
    password: {
      type: String,
      required: true, // fixed
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ["user","client","vendor","firm","associate","admin","superadmin"],
      default: "user",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password if modified
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Instance method
userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

// Remove sensitive fields
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

// Prevent OverwriteModelError during dev / hot reload
const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;
