import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

// middlewares
app.use(cors());
app.use(express.json());

// test route
app.get("/", (req, res) => {
    res.send("EcoTrack API is running");
});

// server listen
const port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log("EcoTrack server running on port", port);
});
