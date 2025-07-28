import mongoose from "mongoose";

const plantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Plant Name is required"],
      minlength: [3, "Plant Name must be at least 3 characters"],
      maxlength: [30, "Plant Name cannot exceed 30 characters"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      match: [
        /^[a-zA-Z0-9_ ]+$/,
        "Plant Name can only contain letters, numbers, underscores, and spaces",
      ],
    },
    slug: {
      type: String,
      required: [true, "Slug is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[a-z0-9-]+$/,
        "Slug can only contain lowercase letters, numbers, and hyphens",
      ],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      minlength: [10, "Description must be at least 10 characters"],
      maxlength: [500, "Description cannot exceed 500 characters"],
      trim: true,
    },
    capacity: {
      type: String,
      required: [true, "Capacity is required"],
      minlength: [1, "Capacity must be at least 1 character"],
      maxlength: [50, "Capacity cannot exceed 50 characters"],
    },
    location: {
      type: String,
      required: [true, "Location is required"],
      minlength: [3, "Location must be at least 3 characters"],
      maxlength: [100, "Location cannot exceed 100 characters"],
      trim: true,
    },
    established: {
      type: Date,
      required: [true, "Established date is required"],
    },
    machinery: {
      type: [String],
      required: [true, "Machinery list is required"],
      validate: {
        validator: function (arr) {
          return arr.length > 0;
        },
        message: "Machinery list must contain at least one item",
      },
    },
    certifications: {
      type: [String],
      required: [true, "Certifications list is required"],
      validate: {
        validator: function (arr) {
          return arr.length > 0;
        },
        message: "Certifications list must contain at least one item",
      },
    },
    isActive: {
      type: Boolean,
      required: true,
      default: true,
    },
    seoTitle: {
      type: String,
      required: [true, "SEO Title is required"],
      minlength: [3, "SEO Title must be at least 3 characters"],
      maxlength: [60, "SEO Title cannot exceed 60 characters"],
      trim: true,
    },
    seoDescription: {
      type: String,
      required: [true, "SEO Description is required"],
      minlength: [10, "SEO Description must be at least 10 characters"],
      maxlength: [160, "SEO Description cannot exceed 160 characters"],
      trim: true,
    },
    seoKeywords: {
      type: [String],
      required: [true, "SEO Keywords are required"],
      validate: {
        validator: function (arr) {
          return arr.length > 0;
        },
        message: "SEO Keywords must contain at least one keyword",
      },
    },
  },
  { timestamps: true }
);

export const Plant = mongoose.model("Plant", plantSchema);
