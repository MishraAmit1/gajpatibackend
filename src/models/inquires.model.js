import mongoose from "mongoose";

const inquirySchema = new mongoose.Schema(
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
    companyName: {
      type: String,
      required: [true, "Company/Firm Name is required"],
      minlength: [3, "Company Name must be at least 3 characters"],
      maxlength: [100, "Company Name cannot exceed 100 characters"],
      trim: true,
    },
    city: {
      type: String,
      required: [true, "City/Site Location is required"],
      minlength: [3, "City must be at least 3 characters"],
      maxlength: [50, "City cannot exceed 50 characters"],
      trim: true,
    },
    purpose: {
      type: String,
      required: [true, "Purpose of Request is required"],
      enum: {
        values: ["Tender", "Site Use", "Resale", "Other"],
        message: "Purpose must be one of: Tender, Site Use, Resale, Other",
      },
    },
    source: {
      type: String,
      enum: {
        values: ["Search", "WhatsApp", "Consultant", "Referral", "Other"],
        message:
          "Source must be one of: Search, WhatsApp, Consultant, Referral, Other",
      },
      default: null,
    },
    consent: {
      type: Boolean,
      required: [true, "Consent is required for data processing"],
      default: false,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product ID is required"],
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

export const Inquiry = mongoose.model("Inquiry", inquirySchema);
