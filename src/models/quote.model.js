import mongoose from "mongoose";

const quoteSchema = new mongoose.Schema(
  {
    customerName: {
      type: String,
      required: [true, "Full Name is required"],
      minlength: [3, "Full Name must be at least 3 characters"],
      maxlength: [50, "Full Name cannot exceed 50 characters"],
      trim: true,
    },
    customerEmail: {
      type: String,
      required: [true, "Official Email is required"],
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please provide a valid email address",
      ],
      trim: true,
      lowercase: true,
    },
    customerPhone: {
      type: String,
      required: [true, "Mobile Number is required"],
      match: [
        /^\+91\d{10}$/,
        "Mobile Number must be in the format +91 followed by 10 digits",
      ],
      trim: true,
    },
    city: {
      type: String,
      required: [true, "City/Site Location is required"],
      minlength: [3, "City must be at least 3 characters"],
      maxlength: [50, "City cannot exceed 50 characters"],
      trim: true,
    },
    selectedProducts: {
      type: [String],
      required: [true, "At least one product must be selected"],
      enum: {
        values: ["Bitumen", "Gabion", "Construct"],
        message: "Product must be one of: Bitumen, Gabion, Construct",
      },
      validate: {
        validator: function (v) {
          return v.length > 0;
        },
        message: "At least one product must be selected",
      },
    },
    status: {
      type: String,
      required: [true, "Status is required"],
      enum: {
        values: ["New", "In Progress", "Resolved", "Closed"],
        message: "Status must be one of: New, In Progress, Resolved, Closed",
      },
      default: "New",
    },
    replies: [
      {
        message: {
          type: String,
          required: [true, "Reply message is required"],
          minlength: [3, "Reply message must be at least 3 characters"],
          maxlength: [1000, "Reply message cannot exceed 1000 characters"],
          trim: true,
        },
        repliedAt: {
          type: Date,
          required: [true, "Reply date is required"],
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

export const Quote = mongoose.model("Quote", quoteSchema);
