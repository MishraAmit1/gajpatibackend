import { Subscriber } from "../models/subscriber.model.js";
import { throwApiError } from "../utils/apiError.js";
import { sendResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
export const createSubscriber = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    throw throwApiError(400, "Email is required");
  }
  try {
    const subscriber = await Subscriber.create({ email });
    return sendResponse(res, 201, subscriber, "Subscribed successfully");
  } catch (error) {
    if (error.code === 11000) {
      throw throwApiError(400, "Email already subscribed");
    }
    throw throwApiError(500, "Something went wrong while subscribing");
  }
});

export const getSubscribers = asyncHandler(async (req, res) => {
  try {
    const subscribers = await Subscriber.find().sort({ createdAt: -1 });
    return sendResponse(
      res,
      200,
      subscribers,
      "Subscribers fetched successfully"
    );
  } catch (error) {
    throw throwApiError(
      500,
      "Something went wrong while retrieving subscribers"
    );
  }
});

export const deleteSubscriber = asyncHandler(async (req, res) => {
  const { id } = req.params;
  try {
    const subscriber = await Subscriber.findByIdAndDelete(id);
    if (!subscriber) {
      throw throwApiError(404, "Subscriber not found");
    }
    return sendResponse(
      res,
      200,
      subscriber,
      "Subscriber deleted successfully"
    );
  } catch (error) {
    throw throwApiError(
      500,
      "Something went wrong while deleting the subscriber"
    );
  }
});
