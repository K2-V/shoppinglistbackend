"use client";

import { useEffect, useState } from "react";
import CreateListClient from "./CreateListClient";
import ShoppingListClient from "./ShoppingListClient";

export default function ShoppingListWrapper() {
    const [user, setUser] = useState(null);
    const [lists, setLists] = useState([]);
    const [loadingUser, setLoadingUser] = useState(true);
    const [loadingLists, setLoadingLists] = useState(true);

    // Edit List
    const [editList, setEditList] = useState(null);
    const [editName, setEditName] = useState("");

    // Edit Item
    const [editItem, setEditItem] = useState(null);
    const [editItemName, setEditItemName] = useState("");
    const [editItemQty, setEditItemQty] = useState(1);
    const [editItemUnit, setEditItemUnit] = useState("");

    // Invites
    const [inviteListId, setInviteListId] = useState(null);
    const [inviteUserId, setInviteUserId] = useState("");
    const [inviteMsg, setInviteMsg] = useState("");

    // User Load
    async function loadUser() {
        setLoadingUser(true);

        const res = await fetch("/api/auth/me", {
            credentials: "include",
            cache: "no-store",
        });

        if (res.ok) {
            const data = await res.json();
            setUser(data.user);
        } else {
            setUser(null);
        }

        setLoadingUser(false);
    }

    // Load List
    async function loadLists() {
        setLoadingLists(true);

        const res = await fetch("/api/lists", {
            credentials: "include",
            cache: "no-store",
        });

        if (res.ok) {
            const data = await res.json();
            setLists(data.lists);
        }

        setLoadingLists(false);
    }

    // Delete List
    async function handleDelete(id) {
        await fetch(`/api/lists?id=${id}`, {
            method: "DELETE",
            credentials: "include",
        });
        await loadLists();
    }

    // Start edit list
    function startEdit(list) {
        setEditList(list);
        setEditName(list.name);
    }

    async function confirmEdit() {
        await fetch(`/api/lists?id=${editList._id}`, {
            method: "PUT",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: editName, // už neposíláme id
            }),
        });

        setEditList(null);
        loadLists();
    }

    // Show Item
    async function handleShowItems(listId) {
        const res = await fetch(`/api/items?listId=${listId}`, {
            credentials: "include",
        });

        if (!res.ok) return;

        const data = await res.json();

        setLists(prev =>
            prev.map(l => (l._id === listId ? { ...l, items: data.items } : l))
        );
    }


    // New Item
    async function handleNewItem(listId) {
        const name = prompt("Item name:");
        if (!name) return;

        const quantity = Number(prompt("Quantity:", "1")) || 1;
        const unit = prompt("Unit:", "pcs") || "pcs";
        const note = prompt("Note:", "") || "";

        await fetch("/api/items", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                listId,
                name,
                quantity,
                unit,
                note,
            }),
        });

        handleShowItems(listId);
    }

    // Delete Item
    async function handleDeleteItem(itemId, listId) {
        await fetch(`/api/items?id=${itemId}`, {
            method: "DELETE",
            credentials: "include",
        });

        handleShowItems(listId);
    }

    // Toggle Item
    async function handleToggleItem(itemId, newState, listId) {
        await fetch(`/api/items`, {
            method: "PATCH",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                id: itemId,
                completed: newState,
            }),
        });

        handleShowItems(listId);
    }

    // Edit Item
    function startEditItem(item) {
        setEditItem(item);
        setEditItemName(item.name);
        setEditItemQty(item.quantity);
        setEditItemUnit(item.unit);
    }

    async function confirmEditItem(listId) {
        await fetch(`/api/items`, {
            method: "PUT",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                id: editItem._id,
                name: editItemName,
                quantity: editItemQty,
                unit: editItemUnit,
            }),
        });

        setEditItem(null);
        handleShowItems(listId);
    }

    // Invite User
    function openInviteForm(listId) {
        setInviteListId(listId);
        setInviteUserId("");
        setInviteMsg("");
    }

    function closeInviteForm() {
        setInviteListId(null);
        setInviteUserId("");
        setInviteMsg("");
    }

    async function sendInvite() {
        const res = await fetch("/api/invites", {
            method: "POST",
            credentials: "include",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                shoppingListId: inviteListId,
                userId: inviteUserId,
                role: "member",
            }),
        });

        const data = await res.json();

        if (res.ok) {
            setInviteMsg("Invite sent!");
        } else {
            setInviteMsg("Error: " + JSON.stringify(data.errorMap));
        }
    }
    async function handleLeave(listId) {
        const sure = confirm("Do you really want to leave this list?");
        if (!sure) return;

        const res = await fetch(`/api/lists/leave?id=${listId}`, {
            method: "PATCH",
            credentials: "include",
        });

        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            alert("Failed to leave list: " + (data.error || res.statusText));
            return;
        }

        // Lokálně list skryjeme – už v něm nejsme member
        setLists((prev) => prev.filter((l) => l._id !== listId));
    }

    // Load on start
    useEffect(() => { loadUser(); }, []);
    useEffect(() => { if (user) loadLists(); }, [user]);

    if (loadingUser) return <p>Loading user...</p>;
    if (!user) return <p>You are not logged in.</p>;

    return (
        <div style={{ padding: 10 }}>
            <button onClick={loadLists} style={{ marginBottom: 15 }}>
                Reload lists
            </button>

            <CreateListClient onCreated={loadLists} />

            {/* List edit form */}
            {editList && (
                <div style={{ padding: 10, border: "1px solid #aaa", marginBottom: 15 }}>
                    <h3>Edit list</h3>

                    <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        style={{ marginBottom: 10, display: "block" }}
                    />

                    <button onClick={confirmEdit} style={{ marginRight: 10 }}>
                        Save
                    </button>

                    <button onClick={() => setEditList(null)}>Cancel</button>
                </div>
            )}

            {/* Item edit form */}
            {editItem && (
                <div style={{ padding: 10, border: "1px solid #888", marginBottom: 15 }}>
                    <h3>Edit item</h3>

                    <input
                        type="text"
                        value={editItemName}
                        onChange={(e) => setEditItemName(e.target.value)}
                        placeholder="Name"
                        style={{ display: "block", marginBottom: 10 }}
                    />

                    <input
                        type="number"
                        value={editItemQty}
                        onChange={(e) => setEditItemQty(Number(e.target.value))}
                        placeholder="Quantity"
                        style={{ display: "block", marginBottom: 10 }}
                    />

                    <input
                        type="text"
                        value={editItemUnit}
                        onChange={(e) => setEditItemUnit(e.target.value)}
                        placeholder="Unit"
                        style={{ display: "block", marginBottom: 10 }}
                    />

                    <button onClick={() => confirmEditItem(editItem.listId)} style={{ marginRight: 10 }}>
                        Save
                    </button>

                    <button onClick={() => setEditItem(null)}>Cancel</button>
                </div>
            )}

            {/* Invite dorm */}
            {inviteListId && (
                <div style={{ padding: 10, border: "1px solid #2980b9", marginBottom: 15 }}>
                    <h3>Invite user to list</h3>

                    <p>List ID: {inviteListId}</p>

                    <input
                        type="text"
                        placeholder="User ID"
                        value={inviteUserId}
                        onChange={(e) => setInviteUserId(e.target.value)}
                        style={{ display: "block", marginBottom: 10, width: "100%" }}
                    />

                    <button onClick={sendInvite} style={{ marginRight: 10 }}>
                        Send Invite
                    </button>

                    <button onClick={closeInviteForm}>Cancel</button>

                    {inviteMsg && (
                        <p style={{ marginTop: 10 }}>{inviteMsg}</p>
                    )}
                </div>
            )}

            {/* List view */}
            <ShoppingListClient
                lists={lists}
                loading={loadingLists}
                onDelete={handleDelete}
                onEdit={startEdit}
                onShowItems={handleShowItems}
                onToggleItem={handleToggleItem}
                onNewItem={handleNewItem}
                onEditItem={startEditItem}
                onDeleteItem={handleDeleteItem}
                onInvite={openInviteForm}
                userId={user?.sub || user?.id}
                onLeave={handleLeave}
            />
        </div>
    );
}