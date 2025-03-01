import { Router } from "express";
import { loginUser, registerUser,logoutUser } from "../controllers/user.controllers.js";
import upload from "../middlewares/multer.middleware.js";
import { verifyJWt } from "../middlewares/Auth.middleware.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);

router.route("/login").post(loginUser);
router.route("/logout").post(verifyJWt, logoutUser);

export default router;
