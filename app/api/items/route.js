import { NextResponse } from "next/server";
import { createErrorMap } from "@/app/lib/errorMap";
import { validateDto } from "@/app/lib/validateDto";
import { getSessionUser } from "@/app/lib/auth";
import { authorize } from "@/app/lib/authorization";

const BASE = "items";

const SPECIAL_USER_ID = "108195485435091122559";
const SECOND_USER_ID = "117745167204614174119";

function mockObjectId() {
    return `id_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
}

// MOCK ITEMS – správná struktura
export const MOCK_ITEMS = [
    // SPECIAL USER — LIST: Groceries (id_1764340122289_1140)
    {
        _id: "item_sp1_1",
        listId: "id_1764340122289_1140",
        name: "Milk",
        quantity: 2,
        unit: "liters",
        note: "Whole milk",
        isCompleted: false,
        completedBy: null,
        addedBy: SPECIAL_USER_ID,
        deletedBy: null,
        createdAt: "2024-02-01T09:00:00.000Z",
        updatedAt: "2024-02-01T09:00:00.000Z"
    },
    {
        _id: "item_sp1_2",
        listId: "id_1764340122289_1140",
        name: "Apples",
        quantity: 6,
        unit: "pcs",
        note: "Prefer red apples",
        isCompleted: true,
        completedBy: SPECIAL_USER_ID,
        addedBy: SPECIAL_USER_ID,
        deletedBy: null,
        createdAt: "2024-02-01T09:10:00.000Z",
        updatedAt: "2024-02-01T09:10:00.000Z"
    },

    // SPECIAL USER — LIST: Work Tasks (id_1764340122289_8307)
    {
        _id: "item_sp2_1",
        listId: "id_1764340122289_8307",
        name: "Finish report",
        quantity: 1,
        unit: "task",
        note: "Deadline Friday",
        isCompleted: false,
        completedBy: null,
        addedBy: SPECIAL_USER_ID,
        deletedBy: null,
        createdAt: "2024-02-03T11:00:00.000Z",
        updatedAt: "2024-02-03T11:00:00.000Z"
    },

    // SECOND USER — LIST: Weinachten (id_1764340034510_7780)
    {
        _id: "item_sc1_1",
        listId: "id_1764340034510_7780",
        name: "Christmas tree",
        quantity: 1,
        unit: "pcs",
        note: "",
        isCompleted: true,
        completedBy: SECOND_USER_ID,
        addedBy: SECOND_USER_ID,
        deletedBy: null,
        createdAt: "2024-01-15T08:00:00.000Z",
        updatedAt: "2024-01-15T08:00:00.000Z"
    }
];

// GET — /api/items?listId=
export async function GET(req) {
    const errorMap = createErrorMap();
    const { searchParams } = new URL(req.url);
    const listId = searchParams.get("listId");

    if (!listId) {
        errorMap["items.get.listId"] = { type: "error", message: "listId is required" };
        return NextResponse.json({ errorMap }, { status: 400 });
    }

    const user = await getSessionUser(req, errorMap, BASE);
    if (!user) return NextResponse.json({ errorMap }, { status: 401 });

    const userId = user.sub || user.id;
    const isAdmin = user.roles?.includes("Administrator");

    const allowedOwners = [SPECIAL_USER_ID, SECOND_USER_ID];

    if (!isAdmin && !allowedOwners.includes(userId)) {
        return NextResponse.json(
            { error: "You are not allowed to view items of this list" },
            { status: 403 }
        );
    }

    const items = isAdmin
        ? MOCK_ITEMS.filter((i) => i.listId === listId)
        : MOCK_ITEMS.filter((i) => i.listId === listId && i.addedBy === userId);

    return NextResponse.json({ items, errorMap }, { status: 200 });
}

// POST — Create new item
export async function POST(req) {
    const errorMap = createErrorMap();
    const body = await req.json();

    const schema = {
        listId: "string|nonEmpty",
        name: "string|nonEmpty",
        quantity: "number?",
        unit: "string?",
        note: "string?",
    };

    const isValid = validateDto(body, schema, errorMap, `${BASE}.create`);
    if (!isValid) return NextResponse.json({ errorMap }, { status: 400 });

    const user = await getSessionUser(req, errorMap, BASE);
    if (!user) return NextResponse.json({ errorMap }, { status: 401 });

    const userId = user.sub || user.id;
    const now = new Date().toISOString();

    const newItem = {
        _id: mockObjectId(),
        listId: body.listId,
        name: body.name,
        quantity: body.quantity ?? 1,
        unit: body.unit ?? "",
        note: body.note ?? "",
        isCompleted: false,
        completedBy: null,
        addedBy: userId,
        deletedBy: null,
        createdAt: now,
        updatedAt: now
    };

    MOCK_ITEMS.push(newItem);

    return NextResponse.json({ item: newItem, errorMap }, { status: 200 });
}

// PUT — Update item
export async function PUT(req) {
    const errorMap = createErrorMap();
    const body = await req.json();

    const schema = { id: "string|nonEmpty", name: "string?", quantity: "number?", unit: "string?", note: "string?" };
    const isValid = validateDto(body, schema, errorMap, `${BASE}.update`);
    if (!isValid) return NextResponse.json({ errorMap }, { status: 400 });

    const user = await getSessionUser(req, errorMap, BASE);
    if (!user) return NextResponse.json({ errorMap }, { status: 401 });

    const userId = user.sub || user.id;
    const isAdmin = user.roles?.includes("Administrator");

    const item = MOCK_ITEMS.find((i) => i._id === body.id);
    if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });

    if (!isAdmin && item.addedBy !== userId) {
        return NextResponse.json({ error: "Not allowed to edit item" }, { status: 403 });
    }

    if (body.name !== undefined) item.name = body.name;
    if (body.quantity !== undefined) item.quantity = body.quantity;
    if (body.unit !== undefined) item.unit = body.unit;
    if (body.note !== undefined) item.note = body.note;

    item.updatedAt = new Date().toISOString();

    return NextResponse.json({ item, errorMap }, { status: 200 });
}

// PATCH — Toggle Completed
export async function PATCH(req) {
    const errorMap = createErrorMap();
    const body = await req.json();

    const schema = { id: "string|nonEmpty", completed: "boolean" };
    const isValid = validateDto(body, schema, errorMap, `${BASE}.toggle`);

    if (!isValid) return NextResponse.json({ errorMap }, { status: 400 });

    const user = await getSessionUser(req, errorMap, BASE);
    if (!user) return NextResponse.json({ errorMap }, { status: 401 });

    const userId = user.sub || user.id;
    const isAdmin = user.roles?.includes("Administrator");

    const item = MOCK_ITEMS.find((i) => i._id === body.id);
    if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });

    if (!isAdmin && item.addedBy !== userId) {
        return NextResponse.json({ error: "Not allowed to toggle" }, { status: 403 });
    }

    item.isCompleted = body.completed;
    item.completedBy = body.completed ? userId : null;
    item.updatedAt = new Date().toISOString();

    return NextResponse.json({ item, errorMap }, { status: 200 });
}

// DELETE — Delete item
export async function DELETE(req) {
    const errorMap = createErrorMap();

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
        return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const user = await getSessionUser(req, errorMap, BASE);
    if (!user) return NextResponse.json({ errorMap }, { status: 401 });

    const userId = user.sub || user.id;
    const isAdmin = user.roles?.includes("Administrator");

    const index = MOCK_ITEMS.findIndex((i) => i._id === id);

    if (index === -1) return NextResponse.json({ error: "Item not found" }, { status: 404 });

    const item = MOCK_ITEMS[index];

    if (!isAdmin && item.addedBy !== userId) {
        return NextResponse.json({ error: "Not allowed to delete item" }, { status: 403 });
    }

    MOCK_ITEMS.splice(index, 1);

    return NextResponse.json({ id, deleted: true }, { status: 200 });
}