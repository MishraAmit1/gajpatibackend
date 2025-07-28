import mongoose from "mongoose";

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Document title is required"],
      minlength: [3, "Title must be at least 3 characters"],
      maxlength: [100, "Title cannot exceed 100 characters"],
      trim: true,
      index: true,
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
    excerpt: {
      type: String,
      required: [true, "Excerpt is required"],
      minlength: [10, "Excerpt must be at least 10 characters"],
      maxlength: [300, "Excerpt cannot exceed 300 characters"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      minlength: [10, "Description must be at least 10 characters"],
      maxlength: [500, "Description cannot exceed 500 characters"],
      trim: true,
    },
    content: {
      type: String,
      required: [true, "Content is required"],
      minlength: [50, "Content must be at least 50 characters"],
      trim: true,
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: [
        "Technical Guide",
        "Application",
        "Product Innovation",
        "Sustainability",
        "Quality Assurance",
        "Case Study",
      ],
      trim: true,
    },
    author: {
      type: String,
      required: [true, "Author is required"],
      minlength: [2, "Author name must be at least 2 characters"],
      maxlength: [50, "Author name cannot exceed 50 characters"],
      trim: true,
    },
    readTime: {
      type: String,
      required: [true, "Read time is required"],
      match: [/^\d+\s+min\s+read$/, "Read time must be in format 'X min read'"],
      trim: true,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    tags: {
      type: [String],
      required: [true, "Tags are required"],
      validate: {
        validator: function (arr) {
          return arr.length > 0 && arr.length <= 10;
        },
        message: "Tags must contain at least one tag and maximum 10 tags",
      },
    },
    image: {
      type: String,
      required: [true, "Image URL is required"],
      match: [/^https?:\/\/[^\s$.?#].[^\s]*$/, "Image must be a valid URL"],
      trim: true,
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

export default mongoose.model("Blog", blogSchema);
