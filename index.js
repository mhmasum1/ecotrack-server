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
        timestamps: true,
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
            required: true,
        },
        description: {
            type: String,
        },
        duration: {
            type: Number,
        },
        target: {
            type: String,
        },
        participants: {
            type: Number,
            default: 0,
        },
        impactMetric: {
            type: String,
        },
        createdBy: {
            type: String,
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
            type: String,
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

// ---------- Mongoose Model (Tip) ----------
const tipSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        content: {
            type: String,
            required: true,
        },
        category: {
            type: String,
        },
        author: {
            type: String, // user email
        },
        authorName: {
            type: String,
        },
        upvotes: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true, // createdAt, updatedAt
    }
);

const Tip = mongoose.model("Tip", tipSchema);

// ---------- Mongoose Model (Event) ----------
const eventSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
        },
        description: {
            type: String,
        },
        date: {
            type: Date,
            required: true,
        },
        location: {
            type: String,
        },
        organizer: {
            type: String, // email
        },
        maxParticipants: {
            type: Number,
            default: 0,
        },
        currentParticipants: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

const Event = mongoose.model("Event", eventSchema);



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

app.get("/api/challenges", async (req, res) => {
    try {
        const {
            category,
            minParticipants,
            maxParticipants,
            startFrom,
            startTo,
        } = req.query;

        const filter = {};

        // category filtering (comma separated)
        if (category) {
            const categories = category.split(",");
            filter.category = { $in: categories };
        }

        // participants range
        if (minParticipants || maxParticipants) {
            filter.participants = {};
            if (minParticipants) {
                filter.participants.$gte = Number(minParticipants);
            }
            if (maxParticipants) {
                filter.participants.$lte = Number(maxParticipants);
            }
        }

        // startDate range
        if (startFrom || startTo) {
            filter.startDate = {};
            if (startFrom) {
                filter.startDate.$gte = new Date(startFrom);
            }
            if (startTo) {
                filter.startDate.$lte = new Date(startTo);
            }
        }

        const challenges = await Challenge.find(filter).sort({ createdAt: -1 });
        res.json(challenges);
    } catch (error) {
        console.error("Error fetching challenges:", error.message);
        res.status(500).json({
            message: "Error fetching challenges",
            error: error.message,
        });
    }
});

// GET /api/challenges/:id - get single challenge
app.get("/api/challenges/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const challenge = await Challenge.findById(id);

        if (!challenge) {
            return res.status(404).json({ message: "Challenge not found" });
        }

        res.json(challenge);
    } catch (error) {
        console.error("Error fetching challenge:", error.message);
        res.status(500).json({
            message: "Error fetching challenge",
            error: error.message,
        });
    }
});

// POST /api/challenges - create new challenge
app.post("/api/challenges", async (req, res) => {
    try {
        const challenge = new Challenge(req.body);
        const savedChallenge = await challenge.save();
        res.status(201).json(savedChallenge);
    } catch (error) {
        console.error("Error creating challenge:", error.message);
        res.status(500).json({
            message: "Error creating challenge",
            error: error.message,
        });
    }
});

// PATCH /api/challenges/:id - update challenge
app.patch("/api/challenges/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const updatedChallenge = await Challenge.findByIdAndUpdate(
            id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!updatedChallenge) {
            return res.status(404).json({ message: "Challenge not found" });
        }

        res.json(updatedChallenge);
    } catch (error) {
        console.error("Error updating challenge:", error.message);
        res.status(500).json({
            message: "Error updating challenge",
            error: error.message,
        });
    }
});

// DELETE /api/challenges/:id - delete challenge
app.delete("/api/challenges/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const deletedChallenge = await Challenge.findByIdAndDelete(id);
        if (!deletedChallenge) {
            return res.status(404).json({ message: "Challenge not found" });
        }

        res.json({ message: "Challenge deleted successfully" });
    } catch (error) {
        console.error("Error deleting challenge:", error.message);
        res.status(500).json({
            message: "Error deleting challenge",
            error: error.message,
        });
    }
});

// GET /api/user-challenges?userId=someone@gmail.com
app.get("/api/user-challenges", async (req, res) => {
    try {
        const { userId } = req.query;

        const filter = {};
        if (userId) {
            filter.userId = userId;
        }

        const userChallenges = await UserChallenge.find(filter)
            .populate("challengeId")
            .sort({ createdAt: -1 });

        res.json(userChallenges);
    } catch (error) {
        console.error("Error fetching user challenges:", error.message);
        res.status(500).json({
            message: "Error fetching user challenges",
            error: error.message,
        });
    }
});

// PATCH /api/user-challenges/:id - update user challenge (progress/status)
app.patch("/api/user-challenges/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { status, progress } = req.body;

        const update = {};
        if (status) update.status = status;
        if (typeof progress === "number") update.progress = progress;

        const updated = await UserChallenge.findByIdAndUpdate(id, update, {
            new: true,
            runValidators: true,
        });

        if (!updated) {
            return res.status(404).json({ message: "User challenge not found" });
        }

        res.json(updated);
    } catch (error) {
        console.error("Error updating user challenge:", error.message);
        res.status(500).json({
            message: "Error updating user challenge",
            error: error.message,
        });
    }
});

// GET /api/user-challenges?userId=someone@gmail.com
app.get("/api/user-challenges", async (req, res) => {
    try {
        const { userId } = req.query;

        const filter = {};
        if (userId) {
            filter.userId = userId;
        }

        const userChallenges = await UserChallenge.find(filter)
            .populate("challengeId")
            .sort({ createdAt: -1 });

        res.json(userChallenges);
    } catch (error) {
        console.error("Error fetching user challenges:", error.message);
        res.status(500).json({
            message: "Error fetching user challenges",
            error: error.message,
        });
    }
});

// PATCH /api/user-challenges/:id 
app.patch("/api/user-challenges/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { status, progress } = req.body;

        const update = {};
        if (status) update.status = status;
        if (typeof progress === "number") update.progress = progress;

        const updated = await UserChallenge.findByIdAndUpdate(id, update, {
            new: true,
            runValidators: true,
        });

        if (!updated) {
            return res.status(404).json({ message: "User challenge not found" });
        }

        res.json(updated);
    } catch (error) {
        console.error("Error updating user challenge:", error.message);
        res.status(500).json({
            message: "Error updating user challenge",
            error: error.message,
        });
    }
});

// GET /api/user-challenges?userId=someone@gmail.com
app.get("/api/user-challenges", async (req, res) => {
    try {
        const { userId } = req.query;

        const filter = {};
        if (userId) {
            filter.userId = userId;
        }

        const userChallenges = await UserChallenge.find(filter)
            .populate("challengeId")
            .sort({ createdAt: -1 });

        res.json(userChallenges);
    } catch (error) {
        console.error("Error fetching user challenges:", error.message);
        res.status(500).json({
            message: "Error fetching user challenges",
            error: error.message,
        });
    }
});

// PATCH /api/user-challenges/:id - update status/progress
app.patch("/api/user-challenges/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { status, progress } = req.body;

        const update = {};
        if (status) update.status = status;
        if (typeof progress === "number") update.progress = progress;

        const updated = await UserChallenge.findByIdAndUpdate(id, update, {
            new: true,
            runValidators: true,
        });

        if (!updated) {
            return res.status(404).json({ message: "User challenge not found" });
        }

        res.json(updated);
    } catch (error) {
        console.error("Error updating user challenge:", error.message);
        res.status(500).json({
            message: "Error updating user challenge",
            error: error.message,
        });
    }
});

// GET /api/tips - latest 5 tips
app.get("/api/tips", async (req, res) => {
    try {
        const tips = await Tip.find()
            .sort({ createdAt: -1 })
            .limit(5);

        res.json(tips);
    } catch (error) {
        console.error("Error fetching tips:", error.message);
        res.status(500).json({
            message: "Error fetching tips",
            error: error.message,
        });
    }
});

// GET /api/events - upcoming 4 events
app.get("/api/events", async (req, res) => {
    try {
        const now = new Date();

        const events = await Event.find({
            date: { $gte: now }, // শুধু future events
        })
            .sort({ date: 1 })
            .limit(4);

        res.json(events);
    } catch (error) {
        console.error("Error fetching events:", error.message);
        res.status(500).json({
            message: "Error fetching events",
            error: error.message,
        });
    }
});





// ---------- 404 Handler ----------
app.use((req, res) => {
    res.status(404).json({ message: "Route not found" });
});

// Listen
const port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log("EcoTrack server running on port", port);
});