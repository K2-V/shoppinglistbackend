"use client";

export default function ShoppingListClient({
                                               lists,
                                               loading,
                                               onDelete,
                                               onEdit,
                                               onShowItems,
                                               onToggleItem,
                                               onNewItem,
                                               onEditItem,
                                               onDeleteItem,
                                               onInvite
                                           }) {
    if (loading) return <p>Loading lists…</p>;
    if (!lists || lists.length === 0) return <p>No lists found.</p>;

    return (
        <ul style={{ marginTop: 20 }}>
            {lists.map((list) => (
                <li key={list._id} style={{ marginBottom: 20 }}>
                    <b>{list.name}</b>
                    <br />

                    {/* Edit */}
                    <button
                        onClick={() => onEdit(list)}
                        style={{ marginTop: 5, marginRight: 5, padding: "4px 8px" }}
                    >
                        Edit
                    </button>

                    {/* Delete */}
                    <button
                        onClick={() => onDelete(list._id)}
                        style={{
                            marginTop: 5,
                            marginRight: 5,
                            padding: "4px 8px",
                            backgroundColor: "#c0392b",
                            color: "white",
                            border: "none"
                        }}
                    >
                        Delete
                    </button>

                    {/* Show Items */}
                    <button
                        onClick={() => onShowItems(list._id)}
                        style={{ marginTop: 5, padding: "4px 8px" }}
                    >
                        Show items
                    </button>

                    {/* New Item */}
                    <button
                        onClick={() => onNewItem(list._id)}
                        style={{ marginTop: 5, marginLeft: 5, padding: "4px 8px" }}
                    >
                        New item
                    </button>

                    <button
                        onClick={() => onInvite(list._id)}
                        style={{ marginTop: 5, marginLeft: 5, padding: "4px 8px", background: "#2980b9", color: "white" }}
                    >
                        Invite user
                    </button>

                    {/* Items List */}
                    {list.items && (
                        <ul style={{ marginTop: 10, paddingLeft: 20 }}>
                            {list.items.map((item) => (
                                <li key={item._id} style={{ marginBottom: 6 }}>
                                    {item.name} (x{item.quantity}){" "}
                                    {item.isCompleted ? "✔" : ""}

                                    {/* Tiggle completed */}
                                    <button
                                        onClick={() =>
                                            onToggleItem(
                                                item._id,
                                                !item.isCompleted,
                                                list._id
                                            )
                                        }
                                        style={{ marginLeft: 10 }}
                                    >
                                        {item.isCompleted ? "Undo" : "Done"}
                                    </button>

                                    {/* Edit Item */}
                                    <button
                                        onClick={() => onEditItem(item, list._id)}
                                        style={{ marginLeft: 5 }}
                                    >
                                        Edit
                                    </button>

                                    {/* Delete Item */}
                                    <button
                                        onClick={() => onDeleteItem(item._id, list._id)}
                                        style={{
                                            marginLeft: 5,
                                            color: "white",
                                            background: "red",
                                            border: "none"
                                        }}
                                    >
                                        Delete
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </li>
            ))}
        </ul>
    );
}