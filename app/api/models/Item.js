// app/models/Item.js
import mongoose from "mongoose";

const itemSchema = new mongoose.Schema(
    {
        listId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ShoppingList",
            required: true,
        },

        name: {
            type: String,
            required: true,
            trim: true,
        },

        quantity: {
            type: Number,
            default: 1,
        },

        unit: {
            type: String,
            default: "",
        },

        note: {
            type: String,
            default: "",
        },

        isCompleted: {
            type: Boolean,
            default: false,
        },

        // 👇 TADY JE HLAVNÍ ZMĚNA – STRING, ne ObjectId
        addedBy: {
            type: String,
            required: true,
        },

        completedBy: {
            type: String,
            default: null,
        },

        deletedBy: {
            type: String,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// správný export – bez .model.X (to hází chyby)
export default mongoose.models.Item || mongoose.model("Item", itemSchema);