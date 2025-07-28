import mongoose from "mongoose";
import Blog from "../models/blog.model.js";
import { throwApiError } from "../utils/apiError.js";
import { sendResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadToSupabase, deleteFromSupabase } from "../utils/superbase.js";
import { generateSlug } from "../helper/slug.js";

export const createBlog = asyncHandler(async (req, res) => {
  const {
    title,
    excerpt,
    description,
    content,
    category,
    author,
    readTime,
    featured,
    tags,
    seoTitle,
    seoDescription,
    seoKeywords,
    slug,
  } = req.body;

  // Validate required fields
  if (
    !title ||
    !title.trim() ||
    !excerpt ||
    !excerpt.trim() ||
    !description ||
    !content ||
    !category ||
    !author ||
    !readTime ||
    !seoTitle ||
    !seoDescription ||
    !seoKeywords ||
    !tags
  ) {
    throw throwApiError(
      400,
      "All fields are required: title, excerpt, description, content, category, author, readTime, seoTitle, seoDescription, seoKeywords, tags"
    );
  }

  const imageFile = req.files?.image?.[0];
  if (!imageFile) {
    throw throwApiError(400, "Image file is required");
  }

  const uploadResult = await uploadToSupabase(imageFile, "blog");
  if (!uploadResult?.url) {
    throw throwApiError(500, "Failed to upload image to Supabase");
  }

  const imageUrl = uploadResult.url;

  // Process arrays
  const seoKeywordsArray = Array.isArray(seoKeywords)
    ? seoKeywords
    : seoKeywords
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean);

  const tagsArray = Array.isArray(tags)
    ? tags
    : tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

  // Always generate slug if missing/empty/null, and validate
  let blogSlug = slug && slug.trim() ? slug : title && generateSlug(title);
  if (!blogSlug || !blogSlug.trim()) {
    throw throwApiError(
      400,
      "Slug could not be generated. Please provide a valid title."
    );
  }

  try {
    const blog = await Blog.create({
      title,
      excerpt,
      description,
      content,
      category,
      author,
      readTime,
      featured: featured === "true" || featured === true,
      tags: tagsArray,
      image: imageUrl,
      seoTitle,
      seoDescription,
      seoKeywords: seoKeywordsArray,
      slug: blogSlug,
    });
    return sendResponse(res, 201, blog, "Blog created successfully");
  } catch (error) {
    throw throwApiError(
      500,
      error.message || "Something went wrong while creating the blog"
    );
  }
});

export const getAllBlogs = asyncHandler(async (req, res) => {
  try {
    const { category, featured } = req.query;
    let filter = {};

    if (category && category !== "All") {
      filter.category = category;
    }

    if (featured !== undefined) {
      filter.featured = featured === "true";
    }

    const blogs = await Blog.find(filter).sort({ createdAt: -1 });
    return sendResponse(res, 200, blogs, "Blogs fetched successfully");
  } catch (error) {
    throw throwApiError(500, "Something went wrong while retrieving blogs");
  }
});

export const getBlogById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    throw throwApiError(400, "Invalid Blog ID format");
  }
  try {
    const blog = await Blog.findById(id);
    if (!blog) {
      throw throwApiError(404, "Blog not found");
    }
    return sendResponse(res, 200, blog, "Blog fetched successfully");
  } catch (error) {
    throw throwApiError(500, "Something went wrong while retrieving the blog");
  }
});

export const getBlogBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  if (!slug) {
    throw throwApiError(400, "Slug is required");
  }
  try {
    const blog = await Blog.findOne({ slug });
    if (!blog) {
      throw throwApiError(404, "Blog not found");
    }
    return sendResponse(res, 200, blog, "Blog fetched successfully");
  } catch (error) {
    throw throwApiError(500, "Something went wrong while retrieving the blog");
  }
});

export const updateBlog = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    throw throwApiError(400, "Invalid Blog ID format");
  }

  const {
    title,
    excerpt,
    description,
    content,
    category,
    author,
    readTime,
    featured,
    tags,
    seoTitle,
    seoDescription,
    seoKeywords,
    slug,
  } = req.body;

  let updateData = {
    title,
    excerpt,
    description,
    content,
    category,
    author,
    readTime,
    featured: featured === "true" || featured === true,
    seoTitle,
    seoDescription,
  };

  if (seoKeywords) {
    updateData.seoKeywords = Array.isArray(seoKeywords)
      ? seoKeywords
      : seoKeywords
          .split(",")
          .map((k) => k.trim())
          .filter(Boolean);
  }

  if (tags) {
    updateData.tags = Array.isArray(tags)
      ? tags
      : tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);
  }

  // Always generate slug if missing/empty/null, and validate
  let blogSlug = slug && slug.trim() ? slug : title && generateSlug(title);
  if (!blogSlug || !blogSlug.trim()) {
    throw throwApiError(
      400,
      "Slug could not be generated. Please provide a valid title."
    );
  }
  updateData.slug = blogSlug;

  const imageFile = req.files?.image?.[0];
  if (imageFile) {
    const uploadResult = await uploadToSupabase(imageFile, "blog");
    if (!uploadResult?.url) {
      throw throwApiError(500, "Failed to upload image to Supabase");
    }
    updateData.image = uploadResult.url;
  }

  try {
    const blog = await Blog.findByIdAndUpdate(id, updateData, { new: true });
    if (!blog) {
      throw throwApiError(404, "Blog not found");
    }
    return sendResponse(res, 200, blog, "Blog updated successfully");
  } catch (error) {
    throw throwApiError(500, "Something went wrong while updating the blog");
  }
});

export const deleteBlog = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    throw throwApiError(400, "Invalid Blog ID format");
  }
  try {
    const blog = await Blog.findById(id);
    if (!blog) {
      throw throwApiError(404, "Blog not found");
    }
    // Delete image from Supabase
    if (blog.image) {
      try {
        await deleteFromSupabase(blog.image, "blog");
      } catch (e) {
        // Log but don't block blog deletion if image delete fails
        console.error("Failed to delete image from Supabase:", e.message);
      }
    }
    await Blog.findByIdAndDelete(id);
    return sendResponse(res, 200, blog, "Blog deleted successfully");
  } catch (error) {
    throw throwApiError(500, "Something went wrong while deleting the blog");
  }
});
