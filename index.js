import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const DB_NAME = "ecotrack";

// Build MongoDB URI using username + password from .env
const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.ohbvs.mongodb.net/${DB_NAME}?retryWrites=true&w=majority&appName=Cluster0`;

// MongoDB Connection
mongoose
    .connect(uri, { serverSelectionTimeoutMS: 5000 })
    .then(() => console.log("MongoDB Connected Successfully"))
    .catch((error) =>
        console.error("MongoDB Connection Error:", error.message)
    );

// Test Route
app.get("/", (req, res) => {
    res.send("EcoTrack API is running");
});

// Listen
const port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log("EcoTrack server running on port", port);
});
