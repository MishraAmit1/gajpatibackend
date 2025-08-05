import mongoose from "mongoose";
const natureSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      minlength: [3, "Name must be at least 3 characters"],
      maxlength: [50, "Name cannot exceed 50 characters"],
      unique: true,
      trim: true,
      index: true,
      match: [
        /^[a-zA-Z0-9_ ]+$/,
        "Name can only contain letters, numbers, underscores, and spaces",
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
    plantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Plant",
      required: [true, "Plant ID is required"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      minlength: [10, "Description must be at least 10 characters"],
      maxlength: [500, "Description cannot exceed 500 characters"],
      trim: true,
    },
    image: {
      type: String,
      required: [true, "Image URL is required"],
      match: [/^https?:\/\/[^\s$.?#].[^\s]*$/, "Image must be a valid URL"],
      trim: true,
    },
    technicalOverview: {
      type: String,
      required: [true, "Technical Overview is required"],
      minlength: [10, "Technical Overview must be at least 10 characters"],
      maxlength: [1000, "Technical Overview cannot exceed 1000 characters"],
      trim: true,
    },
    applications: {
      type: [String],
      required: [true, "Applications list is required"],
      validate: {
        validator: function (arr) {
          return arr.length > 0;
        },
        message: "Applications list must contain at least one item",
      },
    },
    keyFeatures: {
      type: [String],
      required: [true, "Key Features list is required"],
      validate: {
        validator: function (arr) {
          return arr.length > 0;
        },
        message: "Key Features list must contain at least one item",
      },
    },
    relatedIndustries: {
      type: [String],
      required: [true, "Related Industries list is required"],
      validate: {
        validator: function (arr) {
          return arr.length > 0;
        },
        message: "Related Industries list must contain at least one item",
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
natureSchema.index({ plantId: 1, isActive: 1 });
export const Nature = mongoose.model("Nature", natureSchema);
