import express, { urlencoded } from "express";
import Cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(
  Cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

//middleware
app.use(express.json({ limit: "20kb" }));
app.use(express.urlencoded({ extended: true, limit: "20kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// routes
import userRouter from "./routes/user.route.js";

app.use("/api/v1/users", userRouter);

export { app };
