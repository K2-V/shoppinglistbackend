import { NextResponse } from "next/server";
import { createErrorMap } from "@/lib/errorMap";
import { validateDto } from "@/lib/validateDto";
import { getSessionUser } from "@/lib/auth";
import { authorize } from "@/lib/authorization";

const BASE = "items";

// 🧱 Mock "databáze" položek (každý list má vlastní položky)
export const MOCK_ITEMS = [
  // user1 lists
  { id: "item1-1a", listId: "list1-1", name: "Milk", quantity: 2, completed: false },
  { id: "item1-1b", listId: "list1-1", name: "Bread", quantity: 1, completed: true },
  { id: "item1-2a", listId: "list1-2", name: "Prepare report", quantity: 1, completed: false },
  { id: "item1-2b", listId: "list1-2", name: "Email client", quantity: 1, completed: false },
  { id: "item1-3a", listId: "list1-3", name: "Pushups", quantity: 20, completed: false },
  { id: "item1-3b", listId: "list1-3", name: "Run 5km", quantity: 1, completed: true },

  // user2 lists
  { id: "item2-1a", listId: "list2-1", name: "Hammer", quantity: 1, completed: false },
  { id: "item2-1b", listId: "list2-1", name: "Nails", quantity: 50, completed: false },
  { id: "item2-2a", listId: "list2-2", name: "Buy wrench", quantity: 1, completed: true },
  { id: "item2-3a", listId: "list2-3", name: "Tent", quantity: 1, completed: false },
  { id: "item2-3b", listId: "list2-3", name: "Sleeping bag", quantity: 2, completed: false },

  // user3 lists
  { id: "item3-1a", listId: "list3-1", name: "Meeting notes", quantity: 1, completed: true },
  { id: "item3-1b", listId: "list3-1", name: "Call client", quantity: 1, completed: false },
  { id: "item3-2a", listId: "list3-2", name: "Buy coffee", quantity: 1, completed: true },
  { id: "item3-3a", listId: "list3-3", name: "Change oil", quantity: 1, completed: false },

  // user4 lists
  { id: "item4-1a", listId: "list4-1", name: "Passport", quantity: 1, completed: true },
  { id: "item4-1b", listId: "list4-1", name: "T-shirt", quantity: 5, completed: false },
  { id: "item4-2a", listId: "list4-2", name: "1984 (Orwell)", quantity: 1, completed: true },
  { id: "item4-3a", listId: "list4-3", name: "Water plants", quantity: 3, completed: false },

  // user5 lists
  { id: "item5-1a", listId: "list5-1", name: "Protein powder", quantity: 1, completed: false },
  { id: "item5-1b", listId: "list5-1", name: "Bananas", quantity: 6, completed: true },
  { id: "item5-2a", listId: "list5-2", name: "Inception", quantity: 1, completed: false },
  { id: "item5-3a", listId: "list5-3", name: "Apples", quantity: 5, completed: false },
];

// ✅ ADD new item (POST)
export async function POST(req) {
    const errorMap = createErrorMap();
    const body = await req.json();

    if (body.quantity !== undefined && typeof body.quantity === "string") {
        const parsed = Number(body.quantity);
        body.quantity = isNaN(parsed) ? undefined : parsed;
    }

    const schema = {
        listId: "string|nonEmpty",
        name: "string|nonEmpty",
        quantity: "number?",
    };
    const isValid = validateDto(body, schema, errorMap, `${BASE}.create`);
    if (!isValid) return NextResponse.json({ errorMap }, { status: 400 });

    const user = await getSessionUser(req, errorMap, BASE);
    if (!user) return NextResponse.json({ errorMap }, { status: 401 });

    const ok = authorize(user, ["User", "Administrator"], errorMap, BASE);
    if (!ok) return NextResponse.json({ errorMap }, { status: 403 });

    const result = {
        id: "mock-item-id",
        listId: body.listId,
        name: body.name,
        quantity: body.quantity ?? 1,
        completed: false,
        createdBy: user.id,
        errorMap,
    };

    return NextResponse.json(result, { status: 200 });
}

// ✅ UPDATE item (PUT)
export async function PUT(req) {
    const errorMap = createErrorMap();
    const body = await req.json();

    if (body.quantity !== undefined && typeof body.quantity === "string") {
        const parsed = Number(body.quantity);
        body.quantity = isNaN(parsed) ? undefined : parsed;
    }

    const schema = {
        id: "string|nonEmpty",
        name: "string?",
        quantity: "number?",
    };
    const isValid = validateDto(body, schema, errorMap, `${BASE}.update`);
    if (!isValid) return NextResponse.json({ errorMap }, { status: 400 });

    const user = await getSessionUser(req, errorMap, BASE);
    if (!user) return NextResponse.json({ errorMap }, { status: 401 });

    const ok = authorize(user, ["User", "Administrator"], errorMap, BASE);
    if (!ok) return NextResponse.json({ errorMap }, { status: 403 });

    const result = {
        id: body.id,
        name: body.name ?? "unchanged",
        quantity: body.quantity ?? "unchanged",
        updatedBy: user.id,
        errorMap,
    };

    return NextResponse.json(result, { status: 200 });
}

// ✅ DELETE item (DELETE)
export async function DELETE(req) {
    const errorMap = createErrorMap();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
        errorMap["items.delete.id"] = { type: "error", message: "id is required" };
        return NextResponse.json({ errorMap }, { status: 400 });
    }

    const user = await getSessionUser(req, errorMap, BASE);
    if (!user) return NextResponse.json({ errorMap }, { status: 401 });

    const ok = authorize(user, ["User", "Administrator"], errorMap, BASE);
    if (!ok) return NextResponse.json({ errorMap }, { status: 403 });

    const result = { id, deleted: true, errorMap };
    return NextResponse.json(result, { status: 200 });
}

// ✅ TOGGLE complete/uncomplete (PATCH)
export async function PATCH(req) {
    const errorMap = createErrorMap();
    const body = await req.json();

    const schema = {
        id: "string|nonEmpty",
        completed: "boolean",
    };
    const isValid = validateDto(body, schema, errorMap, `${BASE}.toggle`);
    if (!isValid) return NextResponse.json({ errorMap }, { status: 400 });

    const user = await getSessionUser(req, errorMap, BASE);
    if (!user) return NextResponse.json({ errorMap }, { status: 401 });

    const ok = authorize(user, ["User", "Administrator"], errorMap, BASE);
    if (!ok) return NextResponse.json({ errorMap }, { status: 403 });

    const result = {
        id: body.id,
        completed: body.completed,
        updatedBy: user.id,
        errorMap,
    };

    return NextResponse.json(result, { status: 200 });
}

// ✅ LIST all items in list (GET)
export async function GET(req) {
    const errorMap = createErrorMap();
    const { searchParams } = new URL(req.url);
    const listId = searchParams.get("listId");

    if (!listId) {
        errorMap["items.list.listId"] = { type: "error", message: "listId is required" };
        return NextResponse.json({ errorMap }, { status: 400 });
    }

    const user = await getSessionUser(req, errorMap, BASE);
    if (!user) return NextResponse.json({ errorMap }, { status: 401 });

    const ok = authorize(user, ["User", "Administrator"], errorMap, BASE);
    if (!ok) return NextResponse.json({ errorMap }, { status: 403 });

    const result = {
        listId,
        items: [
            { id: "item1", name: "Milk", quantity: 2, completed: false },
            { id: "item2", name: "Bread", quantity: 1, completed: true },
        ],
        errorMap,
    };

    return NextResponse.json(result, { status: 200 });
}