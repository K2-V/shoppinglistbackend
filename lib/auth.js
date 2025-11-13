import { addError } from "./errorMap.js";

// 🧱 Mock databáze uživatelů – 5 běžných uživatelů + 1 admin
const USERS = [
    { id: "user1", name: "Alice Johnson", profile: "User" },
    { id: "user2", name: "Bob Smith", profile: "User" },
    { id: "user3", name: "Charlie Davis", profile: "User" },
    { id: "user4", name: "Diana Miller", profile: "User" },
    { id: "user5", name: "Ethan Brown", profile: "User" },
    { id: "admin1", name: "Admin Root", profile: "Administrator" },
];

// ✅ Vrátí přihlášeného uživatele podle hlaviček
export async function getSessionUser(req, errorMap, baseCode) {
    const headers = req.headers;
    const userId = headers.get("x-user-id");
    const profileHeader = headers.get("x-user-profile");

    if (!userId) {
        addError(errorMap, `${baseCode}.auth`, "User not authenticated");
        return null;
    }

    // 🔍 Najdi uživatele podle ID
    const foundUser = USERS.find((u) => u.id === userId);

    if (!foundUser) {
        addError(errorMap, `${baseCode}.auth`, `Unknown user id: ${userId}`);
        return null;
    }

    // Pokud je v hlavičce jiný profil (např. testování Member), použij ho.
    const profile = profileHeader || foundUser.profile;

    return {
        id: foundUser.id,
        name: foundUser.name,
        profile,
    };
}