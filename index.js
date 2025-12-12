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

// ---------- Mongoose Model (Challenge) ----------
const challengeSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
        },
        category: {
            type: String,
            required: true, // e.g. "Waste Reduction", "Energy Saving"
        },
        description: {
            type: String,
        },
        duration: {
            type: Number, // days
        },
        target: {
            type: String, // e.g. "Reduce waste by 2kg/week"
        },
        participants: {
            type: Number,
            default: 0,
        },
        impactMetric: {
            type: String, // e.g. "kg CO2 saved"
        },
        createdBy: {
            type: String, // e.g. admin email / name
        },
        startDate: {
            type: Date,
        },
        endDate: {
            type: Date,
        },
        imageUrl: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

const Challenge = mongoose.model("Challenge", challengeSchema);

// ---------- Mongoose Model (UserChallenge) ----------
const userChallengeSchema = new mongoose.Schema(
    {
        userId: {
            type: String, // tumi email / auth uid use korte paro
            required: true,
        },
        challengeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Challenge",
            required: true,
        },
        status: {
            type: String,
            enum: ["Not Started", "Ongoing", "Finished"],
            default: "Ongoing",
        },
        progress: {
            type: Number,
            default: 0, // percentage (0–100)
        },
        joinDate: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

const UserChallenge = mongoose.model("UserChallenge", userChallengeSchema);


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
// GET /users/:id - get single user by id
app.get("/users/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json(user);
    } catch (error) {
        console.error("Error fetching user:", error.message);
        res
            .status(500)
            .json({ message: "Error fetching user", error: error.message });
    }
});

// PUT /users/:id - update user
app.put("/users/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email } = req.body;

        const updatedUser = await User.findByIdAndUpdate(
            id,
            { name, email },
            { new: true, runValidators: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json(updatedUser);
    } catch (error) {
        console.error("Error updating user:", error.message);
        res
            .status(500)
            .json({ message: "Error updating user", error: error.message });
    }
});

// DELETE /users/:id - delete user
app.delete("/users/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const deletedUser = await User.findByIdAndDelete(id);

        if (!deletedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({ message: "User deleted successfully" });
    } catch (error) {
        console.error("Error deleting user:", error.message);
        res
            .status(500)
            .json({ message: "Error deleting user", error: error.message });
    }
});




// Listen
const port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log("EcoTrack server running on port", port);
});
