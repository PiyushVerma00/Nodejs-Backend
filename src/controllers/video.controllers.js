import { apiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import { uploadOnCloudinary } from "../utils/cloudinary";
import { Videos } from "../models/video.model.js";

const getAllvideos = asyncHandler(async (req, res) => {});

const publishVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  // TODO: get video, upload to cloudinary, create video

  if (!title && !description) {
    throw new apiError(400, "Required All fields");
  }

  const videoLocalPath = req.file?.path;
  const thumbnailLocalPath = req.file?.path;
  if (!videoLocalPath) {
    throw new apiError(400, "Video file is required");
  }

  if (!thumbnailLocalPath) {
    throw new apiError(400, "Thumnail file is required");
  }

  const uploadedVideo = await uploadOnCloudinary(videoLocalPath);
  const uploadedThumbnail = await uploadOnCloudinary(thumbnailLocalPath);

  if (!uploadedVideo.url) {
    throw new apiError(400, "Error uploading video");
  }
  if (!uploadedThumbnail.url) {
    throw new apiError(400, "Error uploading thumbnail");
  }

  const video = await Videos.create({
    title,
    description,
    videoFile: uploadedVideo.url,
    thumbnailL: uploadedThumbnail.url,
    duration: uploadedVideo.duration,
    owner: req.user?._id,
  });

  // const createdVideo = await Videos.findById(videos._id)

  return res
    .status(200)
    .json(new apiRespose(200, { video }, "video Publish successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: get video by id
    

});

export { publishVideo };
