"use client";

import { useState } from "react";

export default function CreateListClient({ onCreated }) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [message, setMessage] = useState(null);
    const [loading, setLoading] = useState(false);

    async function createList() {
        setLoading(true);
        setMessage(null);

        try {
            const res = await fetch("/api/lists", {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ name, description }),
            });


            const data = await res.json();

            if (!res.ok) {
                setMessage("Error: " + JSON.stringify(data.errorMap));
            } else {
                setMessage("List was created!");
                setName("");
                setDescription("");
                if (onCreated) onCreated();
            }
        } catch (error) {
            setMessage("Request failed");
        }

        setLoading(false);
    }

    return (
        <div style={{ marginTop: 20, padding: 10, border: "1px solid #ccc" }}>
            <h3>Create new list</h3>

            <input
                type="text"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ display: "block", marginBottom: 10, padding: 5 }}
            />

            <button onClick={createList} disabled={loading}>
                {loading ? "Creating..." : "Create list"}
            </button>

            {message && (
                <p style={{ marginTop: 10, color: "green" }}>{message}</p>
            )}
        </div>
    );
}