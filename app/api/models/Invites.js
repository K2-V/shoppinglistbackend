// app/api/models/Invite.js
import mongoose from "mongoose";

const inviteSchema = new mongoose.Schema({
    // ID uživatele – stejné jako z auth (Google / GitHub) => string
    userId: { type: String, required: true },

    // Shopping list, na který se zve
    shoppingListId: { type: mongoose.Schema.Types.ObjectId, ref: "ShoppingList", required: true },

    // Můžeš klidně používat jen shoppingListId, listId je redundance
    listId: { type: mongoose.Schema.Types.ObjectId, ref: "ShoppingList" },

    role: {
        type: String,
        enum: ["member", "viewer", "editor", "admin"],
        default: "member",
    },

    accepted: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    acceptedAt: { type: Date },
});

export default mongoose.models.Invite || mongoose.model("Invite", inviteSchema);