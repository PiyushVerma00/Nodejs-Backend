import { apiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { apiRespose } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import mongoose from "mongoose";
import upload from "../middlewares/multer.middleware.js";

const generateAccessTokenAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    // console.log(accessToken);
    // console.log(refreshToken);

    return { accessToken, refreshToken };
  } catch (error) {
    throw new apiError(
      500,
      "Something went worng while generating access and refresh token"
    );
  }
};

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

  const existedUser = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (existedUser) {
    throw new apiError(409, "User with email or username already exist");
  }
  //   console.log(req.files);

  const avatarLocalPath = req.files?.avatar[0]?.path;

  if (!avatarLocalPath) {
    throw new apiError(400, "Avatar file is required");
  }

  //   const coverImageLocalPath = req.files?.coverImage[0]?.path || null;

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (!avatar) {
    throw new apiError(400, "Avatar file is required");
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  const user = await User.create({
    fullname,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new apiError(500, "Something went wrong while registering the user");
  }

  return res
    .status(201)
    .json(new apiRespose(200, createdUser, "User Registered Successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  // data from req.body
  // validate
  // check krenge db m agr h to redirect krdengs ni h to bolenge email not found
  // password check
  //access and fresh token generate
  // send cookie

  const { email, username, password } = req.body;

  if (!email && !username) {
    throw new apiError(400, "Email is required");
  }

  const user = await User.findOne({
    $or: [{ email }, { username }],
  });
  // console.log(user);

  if (!user) {
    throw new apiError(404, "User does not exist");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new apiError(401, "Invalid User Credentials");
  }

  const { accessToken, refreshToken } =
    await generateAccessTokenAndRefreshToken(user._id);

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };
  // console.log(accessToken);
  // console.log(refreshToken);

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new apiRespose(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User Logged in successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new apiRespose(200, {}, "User Logout Successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  // cookies se access krenge refresh token
  //  token ko decode krenge
  //  info lenge  user se
  //  again generate krenge
  // return res

  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    new apiError(401, "Unauthorized Access");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.ACCESS_REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      new apiError(401, "Invalid Refresh Token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      new apiError(401, "RefreshToken is expired");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, newRefreshToken } =
      await generateAccessTokenAndRefreshToken(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new apiRespose(
          200,
          { accessToken, newRefreshToken },
          "Access Token refreshed"
        )
      );
  } catch (error) {
    new apiError(401, error?.message || "Invalid refresh Token");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword, confirmPassword } = req.body;

  const user = await User.findById(req.user?._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new apiError(400, "Invalid Old Password");
  }

  if (!(newPassword === confirmPassword)) {
    throw new apiError(
      400,
      "Your Old Password Is Not Matched With Current Password"
    );
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new apiRespose(200, {}, "Password is changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user?._id).select("-password");
  if (!user) {
    throw new apiError(404, "User Not Found");
  }

  return res
    .status(200)
    .json(new apiRespose(200, { user }, "Current User Fetched Successfully"));
});

const updateUserDetails = asyncHandler(async (req, res) => {
  const { fullname, email } = req.body;

  if (!fullname && !email) {
    throw new apiError(
      400,
      "please fill atleast one field - email or fullname"
    );
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        ...(fullname && { fullname }), // Updates only if fullname is provided
        ...(email && { email }), // Updates only if email is provided
      },
    },
    {
      new: true,
    }
  ).select("-password");

  return res
    .status(200)
    .json(
      new apiRespose(
        200,
        { updatedUser },
        "User details are updated successfully"
      )
    );
});


const updateUserAvatar = asyncHandler( async (req,res)=>{
      const avatarLocalPath = req.file?.path

      if(!avatarLocalPath){
        throw new apiError(400,"Avatar file is missing")
      }

      const avatar =  await uploadOnCloudinary(avatarLocalPath)

      if(!avatar.url){
        throw new apiError(400,"Error while uploading on avatar")
      }

     const user =  await User.findByIdAndUpdate(req.user?._id,{
        $set:{
          avatar: avatar.url
        }
      },{
        new:true
      }).select("-password")

      return res.status(200)
      .json( new apiRespose(200,{user},"Avatar image is updated successfully"))
})

const updateCoverImage = asyncHandler( async (req,res)=>{

    const coverLocalPath = req.file?.path
    if(!coverLocalPath){
      throw new apiError(400,"CoverImage file is missing")
    }

   const coverImage = await uploadOnCloudinary(coverLocalPath)

   if(!coverImage.url){
    throw new apiError(400,"Error while uploading coverImage")
   }

   const user = await User.findByIdAndUpdate(req.user?._id,{
    $set: {
      coverImage: coverImage.url
    }
   },{
    new:true
   }).select("-password")

   return res
   .status(200)
   .json(new apiRespose(200,{user},"CoverImage is updated successfully"))

})

const deleteUser = asyncHandler(async (req,res)=>{
 const user =  await User.findByIdAndDelete(req.user?._id)

 if(!user){
  throw new apiError(404,"user not found")
 }
 return res.status(200)
 .json(new apiRespose(200,{},"User is deleted successfully"))
})

export {
  registerUser,
  loginUser,
  logoutUser,
  changeCurrentPassword,
  getCurrentUser,
  updateUserDetails,
  updateUserAvatar,
  updateCoverImage,
  deleteUser
};
