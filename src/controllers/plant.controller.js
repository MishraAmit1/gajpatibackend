import mongoose from "mongoose";
import { convertToArray } from "../helper/convertArray.js";
import { generateSlug } from "../helper/slug.js";
import { Plant } from "../models/plant.model.js";
import { throwApiError } from "../utils/apiError.js";
import { sendResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Product } from "../models/product.model.js";

export const createPlant = asyncHandler(async (req, res) => {
  const {
    name,
    slug,
    description,
    capacity,
    location,
    established,
    machinery,
    certifications,
    seoTitle,
    seoDescription,
    seoKeywords,
  } = req.body;

  // Validate required fields
  if (
    !name ||
    !description ||
    !capacity ||
    !location ||
    !established ||
    !seoTitle ||
    !seoDescription ||
    !seoKeywords
  ) {
    throw throwApiError(
      400,
      "All required fields must be provided, including capacity"
    );
  }

  // Validate established date
  const establishedDate = new Date(established);
  if (isNaN(establishedDate)) {
    throw throwApiError(400, "Invalid established date format");
  }

  // Generate slug if not provided
  const plantSlug = slug || generateSlug(name);

  // Check if plant already exists
  const existingPlant = await Plant.findOne({
    $or: [{ name: name.toLowerCase() }, { slug: plantSlug }],
  });
  if (existingPlant) {
    throw throwApiError(409, "Plant with this name or slug already exists");
  }

  // Validate and format arrays
  const machineryArray = convertToArray(machinery);
  const certificationsArray = convertToArray(certifications);
  const seoKeywordsArray = convertToArray(seoKeywords);

  // Validate arrays
  if (machineryArray.length === 0) {
    throw throwApiError(
      400,
      "At least one machinery item is required. Use comma to separate multiple items: 'Solar Panels, Inverters'"
    );
  }
  if (certificationsArray.length === 0) {
    throw throwApiError(
      400,
      "At least one certification is required. Use comma to separate multiple items: 'ISO 9001, Green Energy'"
    );
  }
  if (seoKeywordsArray.length === 0) {
    throw throwApiError(
      400,
      "At least one SEO keyword is required. Use comma to separate multiple items: 'solar, energy, green'"
    );
  }

  // Create plant
  try {
    const plant = await Plant.create({
      name,
      slug: plantSlug,
      description,
      capacity,
      location,
      established: establishedDate,
      machinery: machineryArray,
      certifications: certificationsArray,
      seoTitle,
      seoDescription,
      seoKeywords: seoKeywordsArray,
    });
    return sendResponse(res, 201, plant, "Plant created successfully");
  } catch (error) {
    console.error("Error while creating the plant:", error.message);
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      throw throwApiError(409, `Plant with this ${field} already exists`);
    }
    throw throwApiError(500, "Something went wrong while creating the plant");
  }
});

export const fetchPlantswithSearch = asyncHandler(async (req, res) => {
  const { isActive, search } = req.query;
  let filter = {};
  // Apply isActive filter
  if (isActive !== undefined) {
    filter.isActive = isActive === "true";
  }
  // Apply search filter
  if (search && search.trim()) {
    const sanitizedSearch = search
      .trim()
      .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$or = [
      { name: { $regex: sanitizedSearch, $options: "i" } },
      { slug: { $regex: sanitizedSearch, $options: "i" } },
    ];
  }

  try {
    const plants = await Plant.find(filter);
    return sendResponse(
      res,
      200,
      plants,
      "Plants with search fetched successfully"
    );
  } catch (error) {
    console.error("Error while searching plants:", error.message);
    if (error instanceof mongoose.Error) {
      throw throwApiError(400, "Invalid query parameters");
    }
    throw throwApiError(500, "Something went wrong while searching plants");
  }
});

export const getAllPlants = asyncHandler(async (req, res) => {
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
      { location: { $regex: sanitizedSearch, $options: "i" } },
      { description: { $regex: sanitizedSearch, $options: "i" } },
    ];
  }

  try {
    const totalPlants = await Plant.countDocuments(filter);
    const plants = await Plant.find(filter)
      .sort({ [sortBy]: sortDirection })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    return sendResponse(
      res,
      200,
      {
        plants,
        total: totalPlants,
        page: pageNum,
        limit: limitNum,
      },
      "Plants retrieved successfully"
    );
  } catch (error) {
    console.error("Error while retrieving plants:", error.message);
    throw throwApiError(500, "Something went wrong while retrieving plants");
  }
});

export const getPlantsById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Prepare the query based on whether id is an ObjectId or slug
  const isObjectId = mongoose.isValidObjectId(id);
  const filter = isObjectId
    ? { _id: id, isActive: true }
    : { slug: id, isActive: true };

  try {
    // Find plant by ID or slug
    const plant = await Plant.findOne(filter);

    // Check if plant exists
    if (!plant) {
      throw throwApiError(
        404,
        isObjectId
          ? "Plant not found or inactive"
          : "Plant with this slug not found or inactive"
      );
    }

    // Return the plant data
    return sendResponse(
      res,
      200,
      { data: plant },
      "Plant retrieved successfully"
    );
  } catch (error) {
    console.error("Error while retrieving plant:", error.message);
    if (error instanceof mongoose.Error) {
      throw throwApiError(400, "Invalid plant ID or slug");
    }
    throw throwApiError(500, "Something went wrong while retrieving the plant");
  }
});

export const updatePlant = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  if (!id) {
    throw throwApiError(400, "Plant ID is required");
  }
  if (!updateData || Object.keys(updateData).length === 0) {
    throw throwApiError(400, "Update data is required");
  }
  try {
    const existingPlant = await Plant.findById(id);
    if (!existingPlant) {
      throw throwApiError(404, "Plant not found");
    }
    // If name is update then we have to create a new slug
    if (updateData.name && updateData.name !== existingPlant.name) {
      updateData.slug = generateSlug(updateData.name);
      updateData.name = updateData.name.toLowerCase().trim();
    }
    // Handle array fields using convertToArray
    if (updateData.machinery) {
      updateData.machinery = convertToArray(updateData.machinery);
      if (updateData.machinery.length === 0) {
        throw throwApiError(
          400,
          "Machinery list must contain at least one item"
        );
      }
    }

    if (updateData.certifications) {
      updateData.certifications = convertToArray(updateData.certifications);
      if (updateData.certifications.length === 0) {
        throw throwApiError(
          400,
          "Certifications list must contain at least one item"
        );
      }
    }

    if (updateData.seoKeywords) {
      updateData.seoKeywords = convertToArray(updateData.seoKeywords);
      if (updateData.seoKeywords.length === 0) {
        throw throwApiError(
          400,
          "SEO keywords list must contain at least one item"
        );
      }
    }
    // update Plant
    const plant = await Plant.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).select("-__v");
    if (!plant) {
      throw throwApiError(404, "Plant not found");
    }
    return sendResponse(res, 200, plant, "Plant updated successfully");
  } catch (error) {
    console.error("Error while 更新 plant:", error.message);
    if (error instanceof mongoose.Error.ValidationError) {
      throw throwApiError(400, `Validation failed: ${error.message}`);
    }
    if (error.code === 11000) {
      throw throwApiError(409, "Plant with this name or slug already exists");
    }
    throw throwApiError(500, "Something went wrong while updating the plant");
  }
});

export const deletePlant = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    throw throwApiError(400, "Invalid plant ID format");
  }

  try {
    const plant = await Plant.findByIdAndUpdate(
      id,
      { isActive: false, updatedAt: new Date() },
      { new: true }
    );

    if (!plant) {
      throw throwApiError(404, "Plant not found");
    }

    return sendResponse(res, 200, null, "Plant soft deleted successfully");
  } catch (error) {
    console.error("Error while soft deleting plant:", error.message);
    if (error.name === "CastError") {
      throw throwApiError(400, "Invalid plant ID format");
    }
    throw throwApiError(
      500,
      "Something went wrong while soft deleting the plant"
    );
  }
});

export const permanentDeletePlant = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    throw throwApiError(400, "Plant ID is required");
  }

  try {
    const plant = await Plant.findByIdAndDelete(id);

    if (!plant) {
      throw throwApiError(404, "Plant not found");
    }

    return sendResponse(
      res,
      200,
      null,
      "Plant permanently deleted successfully"
    );
  } catch (error) {
    console.error("Error while permanently deleting plant:", error.message);

    if (error.name === "CastError") {
      throw throwApiError(400, "Invalid plant ID format");
    }

    throw throwApiError(
      500,
      "Something went wrong while permanently deleting the plant"
    );
  }
});

export const togglePlantStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    throw throwApiError(400, "Plant ID is required");
  }

  try {
    const plant = await Plant.findById(id);

    if (!plant) {
      throw throwApiError(404, "Plant not found");
    }

    plant.isActive = !plant.isActive;
    await plant.save();

    return sendResponse(
      res,
      200,
      plant,
      `Plant ${plant.isActive ? "activated" : "deactivated"} successfully`
    );
  } catch (error) {
    console.error("Error while toggling plant status:", error.message);

    if (error.name === "CastError") {
      throw throwApiError(400, "Invalid plant ID format");
    }

    throw throwApiError(
      500,
      "Something went wrong while toggling plant status"
    );
  }
});

export const getPlantStats = asyncHandler(async (req, res) => {
  try {
    const stats = await Plant.aggregate([
      {
        $group: {
          _id: null,
          totalPlants: { $sum: 1 },
          activePlants: { $sum: { $cond: ["$isActive", 1, 0] } },
          inactivePlants: { $sum: { $cond: ["$isActive", 0, 1] } },
          avgCapacity: { $avg: "$capacity" },
          locations: { $addToSet: "$location" },
        },
      },
    ]);

    const response = {
      totalPlants: stats[0]?.totalPlants || 0,
      activePlants: stats[0]?.activePlants || 0,
      inactivePlants: stats[0]?.inactivePlants || 0,
      totalLocations: stats[0]?.locations?.length || 0,
      locations: stats[0]?.locations || [],
    };

    return sendResponse(
      res,
      200,
      response,
      "Plant statistics retrieved successfully"
    );
  } catch (error) {
    console.error("Error while fetching plant statistics:", error.message);
    throw throwApiError(
      500,
      "Something went wrong while fetching plant statistics"
    );
  }
});

// Get all plants with their products
export const getAllPlantsWithProducts = asyncHandler(async (req, res) => {
  try {
    const plantsWithProducts = await Plant.aggregate([
      { $match: { isActive: true } },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "plantId",
          as: "products",
        },
      },
      {
        $project: {
          name: 1,
          slug: 1,
          description: 1,
          capacity: 1,
          location: 1,
          established: 1,
          machinery: 1,
          certifications: 1,
          isActive: 1,
          seoTitle: 1,
          seoDescription: 1,
          seoKeywords: 1,
          products: {
            name: 1,
            status: 1,
            quantity: 1,
          },
        },
      },
    ]);
    return sendResponse(
      res,
      200,
      plantsWithProducts,
      "Plants with products fetched successfully"
    );
  } catch (error) {
    console.error("Error while fetching plants with products:", error.message);
    throw throwApiError(
      500,
      "Something went wrong while fetching plants with products"
    );
  }
});
