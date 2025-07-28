import mongoose from "mongoose";
import { convertToArray } from "../helper/convertArray.js";
import { generateSlug } from "../helper/slug.js";
import { Nature } from "../models/nature.model.js";
import { Plant } from "../models/plant.model.js";
import { throwApiError } from "../utils/apiError.js";
import { sendResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadToSupabase, deleteFromSupabase } from "../utils/superbase.js";
import { Product } from "../models/product.model.js";

export const createNature = asyncHandler(async (req, res) => {
  const {
    name,
    slug,
    plantId,
    description,
    technicalOverview,
    applications,
    keyFeatures,
    relatedIndustries,
    seoTitle,
    seoDescription,
    seoKeywords,
  } = req.body;

  if (
    !name ||
    !plantId ||
    !description ||
    !technicalOverview ||
    !applications ||
    !keyFeatures ||
    !relatedIndustries ||
    !seoTitle ||
    !seoDescription ||
    !seoKeywords
  ) {
    throw throwApiError(400, "All fields are required");
  }
  // Validate plantId
  if (!mongoose.isValidObjectId(plantId)) {
    throw throwApiError(400, "Invalid Plant ID format");
  }
  // Check if plant exists and is active
  const plant = await Plant.findOne({ _id: plantId, isActive: true });
  if (!plant) {
    throw throwApiError(404, "Active Plant not found");
  }

  const imageFile = req.files?.image?.[0];
  if (!imageFile) {
    throw throwApiError(400, "Image file is required");
  }

  const uploadResult = await uploadToSupabase(imageFile, "nature");
  if (!uploadResult?.url) {
    throw throwApiError(500, "Failed to upload image to Supabase");
  }
  const imageUrl = uploadResult.url;

  const natureSlug = slug || generateSlug(name);
  const existingNature = await Nature.findOne({
    $or: [{ name: name.toLowerCase() }, { slug: natureSlug }],
  });
  if (existingNature) {
    throw throwApiError(409, "Nature with this name or slug already exists");
  }

  const applicationsArray = convertToArray(applications);
  const keyFeaturesArray = convertToArray(keyFeatures);
  const relatedIndustriesArray = convertToArray(relatedIndustries);
  const seoKeywordsArray = convertToArray(seoKeywords);

  if (applicationsArray.length === 0) {
    throw throwApiError(400, "At least one application is required");
  }
  if (keyFeaturesArray.length === 0) {
    throw throwApiError(400, "At least one key feature is required");
  }
  if (relatedIndustriesArray.length === 0) {
    throw throwApiError(400, "At least one related industry is required");
  }
  if (seoKeywordsArray.length === 0) {
    throw throwApiError(400, "At least one SEO keyword is required");
  }

  try {
    const nature = await Nature.create({
      name,
      slug: natureSlug,
      plantId,
      description,
      image: imageUrl,
      technicalOverview,
      applications: applicationsArray,
      keyFeatures: keyFeaturesArray,
      relatedIndustries: relatedIndustriesArray,
      seoTitle,
      seoDescription,
      seoKeywords: seoKeywordsArray,
    });
    return sendResponse(res, 201, nature, "Nature created successfully");
  } catch (error) {
    console.error("Error while creating the nature:", error.message);
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      throw throwApiError(409, `Nature with this ${field} already exists`);
    }
    throw throwApiError(500, "Something went wrong while creating the nature");
  }
});

export const getAllNatures = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    sortBy = "name",
    sortOrder = "asc",
    search,
    isActive,
  } = req.query;

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const sortDirection = sortOrder === "desc" ? -1 : 1;

  // Build filter
  const filter = {};
  if (typeof isActive !== "undefined" && isActive !== "all") {
    filter.isActive = isActive === "true";
  }
  if (search && search.trim()) {
    const sanitizedSearch = search
      .trim()
      .replace(/[.*+?^${}()|[\\]\\]/g, "\\$&");
    filter.$or = [
      { name: { $regex: sanitizedSearch, $options: "i" } },
      { slug: { $regex: sanitizedSearch, $options: "i" } },
      { description: { $regex: sanitizedSearch, $options: "i" } },
      { technicalOverview: { $regex: sanitizedSearch, $options: "i" } },
      { applications: { $regex: sanitizedSearch, $options: "i" } },
      { keyFeatures: { $regex: sanitizedSearch, $options: "i" } },
      { relatedIndustries: { $regex: sanitizedSearch, $options: "i" } },
    ];
  }

  try {
    const totalNatures = await Nature.countDocuments(filter);
    const natures = await Nature.find(filter)
      .populate("plantId", "name slug")
      .sort({ [sortBy]: sortDirection })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .select("-__v -createdAt -updatedAt");

    return sendResponse(
      res,
      200,
      {
        natures,
        total: totalNatures,
        page: pageNum,
        limit: limitNum,
      },
      "Natures fetched successfully"
    );
  } catch (error) {
    console.error("Error while retrieving natures:", error.message);
    throw throwApiError(500, "Something went wrong while retrieving natures");
  }
});

export const getNatureById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  // Determine if id is an ObjectId or slug
  const isObjectId = mongoose.isValidObjectId(id);
  const filter = isObjectId ? { _id: id } : { slug: id };

  try {
    // Fetch nature with populated plantId
    const nature = await Nature.findOne(filter)
      .populate("plantId", "name slug") // Populate plantId with name and slug
      .select("-__v");

    if (!nature) {
      throw throwApiError(
        404,
        isObjectId
          ? "Nature not found or inactive"
          : "Nature with this slug not found or inactive"
      );
    }

    return sendResponse(res, 200, nature, "Nature fetched successfully");
  } catch (error) {
    console.error("Error while retrieving nature:", error.message);
    if (error instanceof mongoose.Error) {
      throw throwApiError(400, "Invalid nature ID or slug");
    }
    throw throwApiError(
      500,
      "Something went wrong while retrieving the nature"
    );
  }
});

export const fetchNaturesWithSearch = asyncHandler(async (req, res) => {
  const {
    search,
    plantId,
    page = 1,
    limit = 10,
    sortBy = "name",
    sortOrder = "asc",
  } = req.query;
  const query = { isActive: true };

  // Apply plantId filter if provided
  if (plantId) {
    if (!mongoose.isValidObjectId(plantId)) {
      throw throwApiError(400, "Invalid Plant ID format");
    }
    query.plantId = plantId;
  }

  // Apply search filter
  if (search && search.trim()) {
    const sanitizedSearch = search
      .trim()
      .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    query.$or = [
      { name: { $regex: sanitizedSearch, $options: "i" } },
      { description: { $regex: sanitizedSearch, $options: "i" } },
      { applications: { $regex: sanitizedSearch, $options: "i" } },
      { keyFeatures: { $regex: sanitizedSearch, $options: "i" } },
      { relatedIndustries: { $regex: sanitizedSearch, $options: "i" } },
    ];
  }

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const sortDirection = sortOrder === "desc" ? -1 : 1;

  try {
    const total = await Nature.countDocuments(query);
    const natures = await Nature.find(query)
      .populate("plantId", "name slug") // Populate plantId with name and slug
      .select("-__v -createdAt -updatedAt")
      .sort({ [sortBy]: sortDirection }) // Dynamic sorting
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    return sendResponse(
      res,
      200,
      {
        natures,
        total,
        page: pageNum,
        limit: limitNum,
      },
      "Natures fetched successfully"
    );
  } catch (error) {
    console.error("Error while searching natures:", error.message);
    if (error instanceof mongoose.Error) {
      throw throwApiError(400, "Invalid query parameters");
    }
    throw throwApiError(500, "Something went wrong while searching natures");
  }
});

export const updateNature = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    name,
    slug,
    plantId, // Added plantId
    description,
    technicalOverview,
    applications,
    keyFeatures,
    relatedIndustries,
    seoTitle,
    seoDescription,
    seoKeywords,
  } = req.body;

  // Validate ID
  if (!mongoose.isValidObjectId(id)) {
    throw throwApiError(400, "Invalid Nature ID format");
  }

  // Check if Nature exists
  const nature = await Nature.findById(id);
  if (!nature) {
    throw throwApiError(404, "Nature not found");
  }

  // Validate plantId if provided
  if (plantId) {
    if (!mongoose.isValidObjectId(plantId)) {
      throw throwApiError(400, "Invalid Plant ID format");
    }
    const plant = await Plant.findOne({ _id: plantId, isActive: true });
    if (!plant) {
      throw throwApiError(404, "Active Plant not found");
    }
  }

  // Handle image upload
  const imageFile = req.files?.image?.[0];
  let imageUrl = nature.image;
  if (imageFile) {
    const uploadResult = await uploadToSupabase(imageFile, "nature");
    if (!uploadResult?.url) {
      throw throwApiError(500, "Failed to upload image to Supabase");
    }
    // Delete old image if it exists
    if (nature.image) {
      await deleteFromSupabase(nature.image, "nature");
    }
    imageUrl = uploadResult.url;
  }

  // Generate slug if name or slug is updated
  const natureSlug = slug || (name ? generateSlug(name) : nature.slug);
  if (name || slug) {
    const existingNature = await Nature.findOne({
      $or: [{ name: name?.toLowerCase() }, { slug: natureSlug }],
      _id: { $ne: id },
    });
    if (existingNature) {
      throw throwApiError(409, "Nature with this name or slug already exists");
    }
  }

  // Handle array fields
  const applicationsArray = applications
    ? convertToArray(applications)
    : nature.applications;
  const keyFeaturesArray = keyFeatures
    ? convertToArray(keyFeatures)
    : nature.keyFeatures;
  const relatedIndustriesArray = relatedIndustries
    ? convertToArray(relatedIndustries)
    : nature.relatedIndustries;
  const seoKeywordsArray = seoKeywords
    ? convertToArray(seoKeywords)
    : nature.seoKeywords;

  // Validate arrays
  if (applicationsArray.length === 0) {
    throw throwApiError(400, "At least one application is required");
  }
  if (keyFeaturesArray.length === 0) {
    throw throwApiError(400, "At least one key feature is required");
  }
  if (relatedIndustriesArray.length === 0) {
    throw throwApiError(400, "At least one related industry is required");
  }
  if (seoKeywordsArray.length === 0) {
    throw throwApiError(400, "At least one SEO keyword is required");
  }

  try {
    // Update Nature
    const updatedNature = await Nature.findByIdAndUpdate(
      id,
      {
        name: name || nature.name,
        slug: natureSlug,
        plantId: plantId || nature.plantId, // Update plantId if provided
        description: description || nature.description,
        image: imageUrl,
        technicalOverview: technicalOverview || nature.technicalOverview,
        applications: applicationsArray,
        keyFeatures: keyFeaturesArray,
        relatedIndustries: relatedIndustriesArray,
        seoTitle: seoTitle || nature.seoTitle,
        seoDescription: seoDescription || nature.seoDescription,
        seoKeywords: seoKeywordsArray,
        updatedAt: new Date(),
      },
      { new: true, runValidators: true }
    )
      .populate("plantId", "name slug") // Populate plantId in response
      .select("-__v -createdAt -updatedAt");

    if (!updatedNature) {
      throw throwApiError(404, "Nature not found");
    }

    return sendResponse(res, 200, updatedNature, "Nature updated successfully");
  } catch (error) {
    console.error("Error while updating nature:", error.message);
    if (error instanceof mongoose.Error.ValidationError) {
      throw throwApiError(400, `Validation failed: ${error.message}`);
    }
    if (error.code === 11000) {
      throw throwApiError(409, "Nature with this name or slug already exists");
    }
    throw throwApiError(500, "Something went wrong while updating the nature");
  }
});

export const deleteNature = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Validate ID
  if (!mongoose.isValidObjectId(id)) {
    throw throwApiError(400, "Invalid Nature ID format");
  }

  // Find the Nature
  const nature = await Nature.findById(id).populate("plantId", "name slug");
  if (!nature) {
    throw throwApiError(404, "Nature not found");
  }

  // Check for associated active products
  const associatedProducts = await Product.find({
    natureId: id,
    isActive: true,
  });
  if (associatedProducts.length > 0) {
    throw throwApiError(
      400,
      "Cannot deactivate Nature because it is associated with active Products"
    );
  }

  try {
    // Soft delete by setting isActive to false
    nature.isActive = false;
    await nature.save();

    return sendResponse(
      res,
      200,
      nature, // Return the deactivated Nature for consistency
      "Nature deactivated successfully"
    );
  } catch (error) {
    console.error("Error while deactivating Nature:", error.message);
    throw throwApiError(
      500,
      "Something went wrong while deactivating the Nature"
    );
  }
});

export const permanentDeleteNature = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Validate ID
  if (!id || !mongoose.isValidObjectId(id)) {
    throw throwApiError(400, "Invalid Nature ID format");
  }

  // Find the Nature
  const nature = await Nature.findById(id).populate("plantId", "name slug");
  if (!nature) {
    throw throwApiError(404, "Nature not found");
  }

  // Check for associated products (active or inactive)
  const associatedProducts = await Product.find({ natureId: id });
  if (associatedProducts.length > 0) {
    throw throwApiError(
      400,
      "Cannot permanently delete Nature because it is associated with Products"
    );
  }

  try {
    // Delete associated image from Supabase
    if (nature.image) {
      await deleteFromSupabase(nature.image, "nature");
    }

    // Delete the Nature from MongoDB
    await Nature.findByIdAndDelete(id);

    return sendResponse(
      res,
      200,
      nature, // Return the deleted Nature for consistency
      "Nature and associated files permanently deleted successfully"
    );
  } catch (error) {
    console.error("Error while permanently deleting Nature:", error.message);
    if (error instanceof mongoose.Error.CastError) {
      throw throwApiError(400, "Invalid Nature ID format");
    }
    throw throwApiError(
      500,
      "Something went wrong while permanently deleting the Nature"
    );
  }
});

export const toggleNatureStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Validate ID
  if (!mongoose.isValidObjectId(id)) {
    throw throwApiError(400, "Invalid Nature ID format");
  }

  // Find the Nature with populated plantId
  const nature = await Nature.findById(id).populate(
    "plantId",
    "name slug isActive"
  );
  if (!nature) {
    throw throwApiError(404, "Nature not found");
  }

  // If activating, check if the associated Plant is active
  if (!nature.isActive) {
    if (!nature.plantId || !nature.plantId.isActive) {
      throw throwApiError(
        400,
        "Cannot activate Nature because the associated Plant is inactive or not found"
      );
    }
  }

  // If deactivating, check for associated active Products
  if (nature.isActive) {
    const associatedProducts = await Product.find({
      natureId: id,
      isActive: true,
    });
    if (associatedProducts.length > 0) {
      throw throwApiError(
        400,
        "Cannot deactivate Nature because it is associated with active Products"
      );
    }
  }

  try {
    // Toggle isActive status
    nature.isActive = !nature.isActive;
    await nature.save();

    return sendResponse(
      res,
      200,
      nature,
      `Nature ${nature.isActive ? "activated" : "deactivated"} successfully`
    );
  } catch (error) {
    console.error("Error while toggling Nature status:", error.message);
    throw throwApiError(
      500,
      "Something went wrong while toggling Nature status"
    );
  }
});

export const getNatureStats = asyncHandler(async (req, res) => {
  try {
    // Aggregate stats for total, active, inactive natures, and unique plants
    const stats = await Nature.aggregate([
      {
        $group: {
          _id: null,
          totalNatures: { $sum: 1 },
          activeNatures: { $sum: { $cond: ["$isActive", 1, 0] } },
          inactiveNatures: { $sum: { $cond: ["$isActive", 0, 1] } },
          uniquePlants: { $addToSet: "$plantId" },
        },
      },
      {
        $project: {
          _id: 0,
          totalNatures: 1,
          activeNatures: 1,
          inactiveNatures: 1,
          totalPlants: { $size: "$uniquePlants" }, // Count unique plants
        },
      },
    ]);

    // Handle case where no natures exist
    const response = stats[0] || {
      totalNatures: 0,
      activeNatures: 0,
      inactiveNatures: 0,
      totalPlants: 0,
    };

    return sendResponse(
      res,
      200,
      response,
      "Nature stats fetched successfully"
    );
  } catch (error) {
    console.error("Error while fetching Nature stats:", error.message);
    throw throwApiError(
      500,
      "Something went wrong while fetching Nature stats"
    );
  }
});
