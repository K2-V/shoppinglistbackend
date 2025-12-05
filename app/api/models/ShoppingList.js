// app/api/models/ShoppingList.js
import mongoose from "mongoose";

const shoppingListSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, minlength: 1, maxlength: 100 },
        ownerId: { type: String, required: true },
        members: { type: [String], default: [] },

        isArchived: { type: Boolean, default: false },

        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now },
        updatedBy: { type: String }, // taky string, ne ObjectId
    },
    { timestamps: true }
);

export default mongoose.models.ShoppingList ||
mongoose.model("ShoppingList", shoppingListSchema);