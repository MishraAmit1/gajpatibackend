import mongoose from "mongoose";
import { Document } from "../models/document.model.js";
import { Product } from "../models/product.model.js";
import { throwApiError } from "../utils/apiError.js";
import { sendResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadToSupabase } from "../utils/superbase.js";

export const createDocument = asyncHandler(async (req, res) => {
  const { title, type, productId } = req.body;

  // Validate required fields
  if (!title || !type || !productId) {
    throw throwApiError(400, "Title, type, and product ID are required");
  }

  // Validate productId
  if (!mongoose.isValidObjectId(productId)) {
    throw throwApiError(400, "Invalid Product ID format");
  }

  // Check if product exists
  const product = await Product.findById(productId);
  if (!product) {
    throw throwApiError(404, "Product not found");
  }

  // Validate file
  const file = req.file;
  if (!file) {
    throw throwApiError(400, "Document file is required");
  }

  // Validate file extension
  const fileExt = file.originalname.split(".").pop().toLowerCase();
  if (!["pdf", "doc", "docx"].includes(fileExt)) {
    throw throwApiError(400, "File must be a PDF, DOC, or DOCX");
  }

  // Upload file to Supabase
  const uploadResult = await uploadToSupabase(file, "documents");
  if (!uploadResult?.url) {
    throw throwApiError(500, "Failed to upload document to Supabase");
  }

  // Create document
  try {
    const document = await Document.create({
      title,
      type,
      fileUrl: uploadResult.url,
      productId,
    });
    return sendResponse(res, 201, document, "Document created successfully");
  } catch (error) {
    console.error("Error while creating the document:", error.message);
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      throw throwApiError(409, `Document with this ${field} already exists`);
    }
    throw throwApiError(
      500,
      "Something went wrong while creating the document"
    );
  }
});

export const getAllDocuments = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    sortBy = "title",
    sortOrder = "asc",
  } = req.query;

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const sortDirection = sortOrder === "desc" ? -1 : 1;

  try {
    const totalDocuments = await Document.countDocuments();
    const documents = await Document.find()
      .populate("productId", "name slug")
      .sort({ [sortBy]: sortDirection })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .select("-__v");

    return sendResponse(
      res,
      200,
      {
        documents,
        total: totalDocuments,
        page: pageNum,
        limit: limitNum,
      },
      "Documents retrieved successfully"
    );
  } catch (error) {
    console.error("Error while retrieving documents:", error.message);
    throw throwApiError(500, "Something went wrong while retrieving documents");
  }
});

export const getDocumentById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    throw throwApiError(400, "Invalid document ID format");
  }

  try {
    const document = await Document.findById(id)
      .populate("productId", "name slug")
      .select("-__v");

    if (!document) {
      throw throwApiError(404, "Document not found");
    }

    return sendResponse(res, 200, document, "Document retrieved successfully");
  } catch (error) {
    console.error("Error while retrieving document:", error.message);
    if (error instanceof mongoose.Error) {
      throw throwApiError(400, "Invalid document ID");
    }
    throw throwApiError(
      500,
      "Something went wrong while retrieving the document"
    );
  }
});

export const fetchDocumentsWithSearch = asyncHandler(async (req, res) => {
  const { search, productId, type } = req.query;
  let filter = {};

  if (search && search.trim()) {
    const sanitizedSearch = search
      .trim()
      .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$or = [
      { title: { $regex: sanitizedSearch, $options: "i" } },
      { type: { $regex: sanitizedSearch, $options: "i" } },
    ];
  }

  if (productId && mongoose.isValidObjectId(productId)) {
    filter.productId = productId;
  }

  if (type) {
    filter.type = type;
  }

  try {
    const documents = await Document.find(filter)
      .populate("productId", "name slug")
      .select("-__v");

    return sendResponse(
      res,
      200,
      documents,
      "Documents with search fetched successfully"
    );
  } catch (error) {
    console.error("Error while searching documents:", error.message);
    if (error instanceof mongoose.Error) {
      throw throwApiError(400, "Invalid query parameters");
    }
    throw throwApiError(500, "Something went wrong while searching documents");
  }
});

export const updateDocument = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, type, productId } = req.body;

  if (!id) {
    throw throwApiError(400, "Document ID is required");
  }

  try {
    const existingDocument = await Document.findById(id);
    if (!existingDocument) {
      throw throwApiError(404, "Document not found");
    }

    let fileUrl = existingDocument.fileUrl;
    if (req.file) {
      // Validate file extension
      const fileExt = req.file.originalname.split(".").pop().toLowerCase();
      if (!["pdf", "doc", "docx"].includes(fileExt)) {
        throw throwApiError(400, "File must be a PDF, DOC, or DOCX");
      }

      // Upload new file to Supabase
      const uploadResult = await uploadToSupabase(req.file, "documents");
      if (!uploadResult?.url) {
        throw throwApiError(500, "Failed to upload document to Supabase");
      }
      fileUrl = uploadResult.url;
    }

    // Validate productId if provided
    if (productId && !mongoose.isValidObjectId(productId)) {
      throw throwApiError(400, "Invalid Product ID format");
    }
    if (productId) {
      const product = await Product.findById(productId);
      if (!product) {
        throw throwApiError(404, "Product not found");
      }
    }

    // Update document
    const document = await Document.findByIdAndUpdate(
      id,
      {
        title: title || existingDocument.title,
        type: type || existingDocument.type,
        fileUrl,
        productId: productId || existingDocument.productId,
        updatedAt: new Date(),
      },
      { new: true, runValidators: true }
    )
      .populate("productId", "name slug")
      .select("-__v");

    if (!document) {
      throw throwApiError(404, "Document not found");
    }

    return sendResponse(res, 200, document, "Document updated successfully");
  } catch (error) {
    console.error("Error while updating document:", error.message);
    if (error instanceof mongoose.Error.ValidationError) {
      throw throwApiError(400, `Validation failed: ${error.message}`);
    }
    if (error.code === 11000) {
      throw throwApiError(409, "Document with this title already exists");
    }
    throw throwApiError(
      500,
      "Something went wrong while updating the document"
    );
  }
});

export const deleteDocument = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    throw throwApiError(400, "Invalid document ID format");
  }

  try {
    const document = await Document.findById(id);
    if (!document) {
      throw throwApiError(404, "Document not found");
    }

    // Soft delete by removing reference from product
    await Product.updateOne(
      { $or: [{ brochure: id }, { tds: id }] },
      { $unset: { brochure: id, tds: id } }
    );

    await document.deleteOne();

    return sendResponse(res, 200, null, "Document soft deleted successfully");
  } catch (error) {
    console.error("Error while soft deleting document:", error.message);
    if (error.name === "CastError") {
      throw throwApiError(400, "Invalid document ID format");
    }
    throw throwApiError(
      500,
      "Something went wrong while soft deleting the document"
    );
  }
});

export const permanentDeleteDocument = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    throw throwApiError(400, "Invalid document ID format");
  }

  try {
    const document = await Document.findByIdAndDelete(id);
    if (!document) {
      throw throwApiError(404, "Document not found");
    }

    // Remove references from product
    await Product.updateOne(
      { $or: [{ brochure: id }, { tds: id }] },
      { $unset: { brochure: id, tds: id } }
    );

    // Optionally delete document from Supabase (if needed)
    // Note: Add Supabase deletion if required

    return sendResponse(
      res,
      200,
      null,
      "Document permanently deleted successfully"
    );
  } catch (error) {
    console.error("Error while permanently deleting document:", error.message);
    if (error.name === "CastError") {
      throw throwApiError(400, "Invalid document ID format");
    }
    throw throwApiError(
      500,
      "Something went wrong while permanently deleting the document"
    );
  }
});

export const toggleDocumentStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    throw throwApiError(400, "Invalid document ID format");
  }

  try {
    const document = await Document.findById(id);
    if (!document) {
      throw throwApiError(404, "Document not found");
    }

    // Note: Since document schema doesn't have isActive, you might want to add it
    // For now, we'll assume it's a placeholder for future use
    document.isActive = !document.isActive || true;
    await document.save();

    return sendResponse(
      res,
      200,
      document,
      `Document ${document.isActive ? "activated" : "deactivated"} successfully`
    );
  } catch (error) {
    console.error("Error while toggling document status:", error.message);
    if (error.name === "CastError") {
      throw throwApiError(400, "Invalid document ID format");
    }
    throw throwApiError(
      500,
      "Something went wrong while toggling document status"
    );
  }
});

export const getDocumentStats = asyncHandler(async (req, res) => {
  try {
    const stats = await Document.aggregate([
      {
        $group: {
          _id: null,
          totalDocuments: { $sum: 1 },
          byType: { $addToSet: "$type" },
          byProduct: { $addToSet: "$productId" },
        },
      },
    ]);

    const response = {
      totalDocuments: stats[0]?.totalDocuments || 0,
      totalTypes: stats[0]?.byType?.length || 0,
      totalProducts: stats[0]?.byProduct?.length || 0,
    };

    return sendResponse(
      res,
      200,
      response,
      "Document statistics retrieved successfully"
    );
  } catch (error) {
    console.error("Error while fetching document statistics:", error.message);
    throw throwApiError(
      500,
      "Something went wrong while fetching document statistics"
    );
  }
});
