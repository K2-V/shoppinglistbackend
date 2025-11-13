import { NextResponse } from "next/server";
import { createErrorMap } from "@/lib/errorMap";
import { validateDto } from "@/lib/validateDto";
import { getSessionUser } from "@/lib/auth";
import { authorize } from "@/lib/authorization";

const BASE = "lists";

// 🧱 Mock "databáze" seznamů – 5 uživatelů, každý má 3 seznamy
const MOCK_LISTS = [
    // 🧍 user1
    { id: "list1-1", name: "Groceries", description: "Weekly food shopping", ownerId: "user1" },
    { id: "list1-2", name: "Work Tasks", description: "Project TODOs", ownerId: "user1" },
    { id: "list1-3", name: "Fitness", description: "Training plan", ownerId: "user1" },

    // 🧍 user2
    { id: "list2-1", name: "Hardware Store", description: "Tools & supplies", ownerId: "user2" },
    { id: "list2-2", name: "Home Repairs", description: "Fix kitchen sink", ownerId: "user2" },
    { id: "list2-3", name: "Camping", description: "Camping equipment", ownerId: "user2" },

    // 🧍 user3
    { id: "list3-1", name: "Work", description: "Client meetings", ownerId: "user3" },
    { id: "list3-2", name: "Shopping", description: "Groceries and gifts", ownerId: "user3" },
    { id: "list3-3", name: "Car Maintenance", description: "Oil change", ownerId: "user3" },

    // 🧍 user4
    { id: "list4-1", name: "Vacation", description: "Packing list", ownerId: "user4" },
    { id: "list4-2", name: "Books to Read", description: "Reading goals", ownerId: "user4" },
    { id: "list4-3", name: "Garden", description: "Plant care schedule", ownerId: "user4" },

    // 🧍 user5
    { id: "list5-1", name: "Gym", description: "Training & nutrition", ownerId: "user5" },
    { id: "list5-2", name: "Movies", description: "Watchlist", ownerId: "user5" },
    { id: "list5-3", name: "Groceries", description: "Weekly shopping", ownerId: "user5" },
];

// ✅ CREATE new list
export async function POST(req) {
    const errorMap = createErrorMap();
    const body = await req.json();

    const schema = { name: "string|nonEmpty", description: "string?" };
    const isValid = validateDto(body, schema, errorMap, `${BASE}.create`);
    if (!isValid) return NextResponse.json({ errorMap }, { status: 400 });

    const user = await getSessionUser(req, errorMap, BASE);
    if (!user) return NextResponse.json({ errorMap }, { status: 401 });

    const ok = authorize(user, ["User", "Administrator"], errorMap, BASE);
    if (!ok) return NextResponse.json({ errorMap }, { status: 403 });

    const newList = {
        id: `list-${user.id}-${Date.now()}`,
        name: body.name,
        description: body.description || null,
        ownerId: user.id,
    };

    MOCK_LISTS.push(newList);

    const result = { ...newList, errorMap };
    return NextResponse.json(result, { status: 200 });
}

// ✅ UPDATE list
export async function PUT(req) {
    const errorMap = createErrorMap();
    const body = await req.json();

    const schema = { id: "string|nonEmpty", name: "string?", description: "string?" };
    const isValid = validateDto(body, schema, errorMap, `${BASE}.update`);
    if (!isValid) return NextResponse.json({ errorMap }, { status: 400 });

    const user = await getSessionUser(req, errorMap, BASE);
    if (!user) return NextResponse.json({ errorMap }, { status: 401 });

    const ok = authorize(user, ["User", "Administrator"], errorMap, BASE);
    if (!ok) return NextResponse.json({ errorMap }, { status: 403 });

    const list = MOCK_LISTS.find((l) => l.id === body.id);
    if (!list) {
        errorMap[`${BASE}.update.notFound`] = { type: "error", message: "List not found" };
        return NextResponse.json({ errorMap }, { status: 404 });
    }

    list.name = body.name ?? list.name;
    list.description = body.description ?? list.description;

    const result = {
        id: list.id,
        name: list.name,
        description: list.description,
        updatedBy: user.id,
        errorMap,
    };

    return NextResponse.json(result, { status: 200 });
}

// ✅ DELETE list
export async function DELETE(req) {
    const errorMap = createErrorMap();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
        errorMap["lists.delete.id"] = { type: "error", message: "id is required" };
        return NextResponse.json({ errorMap }, { status: 400 });
    }

    const user = await getSessionUser(req, errorMap, BASE);
    if (!user) return NextResponse.json({ errorMap }, { status: 401 });

    const ok = authorize(user, ["User", "Administrator"], errorMap, BASE);
    if (!ok) return NextResponse.json({ errorMap }, { status: 403 });

    const index = MOCK_LISTS.findIndex((l) => l.id === id);
    if (index === -1) {
        errorMap["lists.delete.notFound"] = { type: "error", message: "List not found" };
        return NextResponse.json({ errorMap }, { status: 404 });
    }

    MOCK_LISTS.splice(index, 1);

    const result = { id, deleted: true, errorMap };
    return NextResponse.json(result, { status: 200 });
}

// ✅ LIST all (GET)
export async function GET(req) {
    const errorMap = createErrorMap();
    const user = await getSessionUser(req, errorMap, BASE);
    if (!user) return NextResponse.json({ errorMap }, { status: 401 });

    const ok = authorize(user, ["User", "Administrator"], errorMap, BASE);
    if (!ok) return NextResponse.json({ errorMap }, { status: 403 });

    // 🧠 Admin vidí všechny seznamy, běžný uživatel jen své
    const visibleLists =
        user.profile === "Administrator"
            ? MOCK_LISTS
            : MOCK_LISTS.filter((l) => l.ownerId === user.id);

    const result = {
        lists: visibleLists,
        errorMap,
    };

    return NextResponse.json(result, { status: 200 });
}