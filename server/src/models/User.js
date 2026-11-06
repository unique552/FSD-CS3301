const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    studentId: {
      type: String,
      unique: true,
      sparse: true,
      uppercase: true,
      trim: true,
      maxlength: 40,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    department: {
      type: String,
      trim: true,
      maxlength: 120,
    },
    program: {
      type: String,
      trim: true,
      maxlength: 120,
    },
    academicYear: {
      type: Number,
      min: 1,
      max: 8,
    },
    phone: {
      type: String,
      trim: true,
      maxlength: 24,
    },
    role: {
      type: String,
      enum: ['student', 'faculty', 'administrator'],
      default: 'student',
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_document, result) => {
        delete result._id;
        delete result.__v;
        delete result.password;
        return result;
      },
    },
  },
);

module.exports = mongoose.model('User', userSchema);
