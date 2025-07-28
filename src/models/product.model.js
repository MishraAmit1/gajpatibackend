import mongoose from "mongoose";
const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product Name is required"],
      minlength: [3, "Product Name must be at least 3 characters"],
      maxlength: [50, "Product Name cannot exceed 50 characters"],
      unique: true,
      trim: true,
      index: true,
      match: [
        /^[a-zA-Z0-9_ ]+$/,
        "Product Name can only contain letters, numbers, underscores, and spaces",
      ],
    },
    abbreviation: {
      type: String,
      required: [true, "Abbreviation is required"],
      minlength: [2, "Abbreviation must be at least 2 characters"],
      maxlength: [10, "Abbreviation cannot exceed 10 characters"],
      uppercase: true,
      trim: true,
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
    natureId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Nature",
      required: [true, "Nature ID is required"],
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
      maxlength: [1000, "Description cannot exceed 1000 characters"],
      trim: true,
    },
    shortDescription: {
      type: String,
      required: [true, "Short Description is required"],
      minlength: [5, "Short Description must be at least 5 characters"],
      maxlength: [200, "Short Description cannot exceed 200 characters"],
      trim: true,
    },
    isActive: {
      type: Boolean,
      required: true,
      default: true,
    },
    images: [
      {
        url: {
          type: String,
          required: [true, "Image URL is required"],
          match: [/^https?:\/\/[^\s$.?#].[^\s]*$/, "Image must be a valid URL"],
          trim: true,
        },
        alt: {
          type: String,
          required: [true, "Image alt text is required"],
          minlength: [3, "Alt text must be at least 3 characters"],
          maxlength: [100, "Alt text cannot exceed 100 characters"],
          trim: true,
        },
        isPrimary: {
          type: Boolean,
          default: false,
        },
      },
    ],
    brochure: {
      url: {
        type: String,
        required: [true, "Brochure URL is required"],
        match: [
          /^https?:\/\/[^\s$.?#].[^\s]*\.(pdf|doc|docx)$/,
          "Brochure must be a valid PDF, DOC, or DOCX URL",
        ],
        trim: true,
      },
      title: {
        type: String,
        required: [true, "Brochure title is required"],
        minlength: [3, "Title must be at least 3 characters"],
        maxlength: [100, "Title cannot exceed 100 characters"],
        trim: true,
      },
    },
    tds: {
      url: {
        type: String,
        required: [true, "TDS URL is required"],
        match: [
          /^https?:\/\/[^\s$.?#].[^\s]*\.(pdf|doc|docx)$/,
          "TDS must be a valid PDF, DOC, or DOCX URL",
        ],
        trim: true,
      },
      title: {
        type: String,
        required: [true, "TDS title is required"],
        minlength: [3, "Title must be at least 3 characters"],
        maxlength: [100, "Title cannot exceed 100 characters"],
        trim: true,
      },
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
    technicalSpecifications: [
      {
        key: { type: String, required: [true, "Key is required"], trim: true },
        value: {
          type: String,
          required: [true, "Value is required"],
          trim: true,
        },
      },
    ],
    plantAvailability: [
      {
        state: {
          type: String,
          required: [true, "State is required"],
          trim: true,
        },
      },
    ],
    applications: [
      {
        type: String,
        required: [true, "Application is required"],
        trim: true,
      },
    ],
    status: {
      type: String,
      enum: ["In Stock", "Limited Stock", "Out of Stock"],
      required: [true, "Status is required"],
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

export const Product = mongoose.model("Product", productSchema);
