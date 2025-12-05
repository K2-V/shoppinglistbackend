import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        _id: { type: String, required: true },
        name: { type: String, required: false },
        email: { type: String, required: false, unique: true },
        picture: { type: String },
        roles: {type: [String], default: ["User"]},
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

export default mongoose.models.User ||
mongoose.model("User", userSchema);