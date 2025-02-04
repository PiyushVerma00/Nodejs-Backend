import { User } from "../models/user.model.js";
import { apiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { apiRespose } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
  //  data from req.body ex- username, email, phone
  //validation - not empty
  // if user exist by checking his email on db show "user already exist" else store new users details
  // check for images, check for avatar
  //upload them to cloudinary, avatar
  // create user object - create entry in db
  // remove password and refresh token field form resposne
  // check user creation try catch
  // return res

  const { username, fullname, email, password } = req.body;
  // console.log(username , " + ",fullname);

  if (!fullname || !username || !email || !password) {
    throw new apiError(400, "Required All fields");
  }

  const existedUser = await User.findOne({ email, username });
  if (existedUser) {
    throw new apiError(409, "User with email or username already exist");
  }
  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path;

  if (!avatarLocalPath) {
    throw new apiError(400, "Avatar file is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new apiError(400, "Avatar file is required");
  }

  const user = await User.create({
    fullname,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  const createdUser = User.findById(user._id).select("-password -refreshToken");

  if (!createdUser) {
    throw new apiError(500, "Something went wrong while registering the user");
  }

  return res
    .status(201)
    .json(new apiRespose(200, createdUser, "User Registered Successfully"));
});

export { registerUser };
