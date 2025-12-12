const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const DB_NAME = "ecotrack";

const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.oeyfvq1.mongodb.net/${DB_NAME}?retryWrites=true&w=majority&appName=Cluster0`;

// MongoDB Connection
mongoose
    .connect(uri, { serverSelectionTimeoutMS: 5000 })
    .then(() => console.log("MongoDB Connected Successfully"))
    .catch((error) =>
        console.error("MongoDB Connection Error:", error.message)
    );

// ---------- Mongoose Model (User) ----------
const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
        },
    },
    {
        timestamps: true, // createdAt, updatedAt
    }
);

const User = mongoose.model("User", userSchema);


// Test Route
app.get("/", (req, res) => {
    res.send("EcoTrack API is running");
});

// GET /users - get all users
app.get("/users", async (req, res) => {
    try {
        const users = await User.find().sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        console.error("Error fetching users:", error.message);
        res
            .status(500)
            .json({ message: "Error fetching users", error: error.message });
    }
});

// POST /users - create new user
app.post("/users", async (req, res) => {
    try {
        const { name, email } = req.body;

        // basic validation
        if (!name || !email) {
            return res.status(400).json({
                message: "name and email are required",
            });
        }

        const user = new User({ name, email });
        const savedUser = await user.save();

        res.status(201).json(savedUser);
    } catch (error) {
        console.error("Error creating user:", error.message);

        // handle duplicate email error
        if (error.code === 11000) {
            return res.status(400).json({
                message: "Email already exists",
            });
        }

        res
            .status(500)
            .json({ message: "Error creating user", error: error.message });
    }
});



// Listen
const port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log("EcoTrack server running on port", port);
});
