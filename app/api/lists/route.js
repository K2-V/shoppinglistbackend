import { NextResponse } from "next/server";
import { createErrorMap } from "@/app/lib/errorMap";
import { validateDto } from "@/app/lib/validateDto";
import { getSessionUser } from "@/app/lib/auth";
import { authorize } from "@/app/lib/authorization";

const BASE = "lists";

const SPECIAL_USER_ID = "108195485435091122559";
const SECOND_USER_ID = "117745167204614174119";

function mockObjectId() {
    return `id_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
}

export const MOCK_LISTS = [
    {
        _id: "id_1764340122289_1140",
        name: "Groceries",
        ownerId: SPECIAL_USER_ID,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        _id: "id_1764340122289_8307",
        name: "Work Tasks",
        ownerId: SPECIAL_USER_ID,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        _id: "id_1764340122289_3027",
        name: "Backend",
        ownerId: SPECIAL_USER_ID,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        _id: "id_1764340034510_7780",
        name: "Weinachten",
        ownerId: SECOND_USER_ID,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        _id: "id_1764340034510_5957",
        name: "Abendessen",
        ownerId: SECOND_USER_ID,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        _id: "id_1764340034510_2976",
        name: "Geschenke",
        ownerId: SECOND_USER_ID,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
];

// GET — user sees only their lists, admin sees all
export async function GET(req) {
    const errorMap = createErrorMap();
    const user = await getSessionUser(req, errorMap, BASE);
    if (!user) return NextResponse.json({ errorMap }, { status: 401 });

    const ok = authorize(user, ["User", "Administrator"], errorMap, BASE);
    if (!ok) return NextResponse.json({ errorMap }, { status: 403 });

    const userId = user.sub || user.id;
    const isAdmin = user.roles?.includes("Administrator");

    const visibleLists = isAdmin
        ? MOCK_LISTS
        : MOCK_LISTS.filter((l) => l.ownerId === userId);

    return NextResponse.json({ lists: visibleLists, errorMap }, { status: 200 });
}

// POST — create new list under logged user
export async function POST(req) {
    const errorMap = createErrorMap();
    const body = await req.json();

    const schema = { name: "string|nonEmpty" };
    const isValid = validateDto(body, schema, errorMap, `${BASE}.create`);
    if (!isValid) return NextResponse.json({ errorMap }, { status: 400 });

    const user = await getSessionUser(req, errorMap, BASE);
    if (!user) return NextResponse.json({ errorMap }, { status: 401 });

    const userId = user.sub || user.id;
    const now = new Date().toISOString();

    const newList = {
        _id: mockObjectId(),
        name: body.name,
        ownerId: userId,
        createdAt: now,
        updatedAt: now,
    };

    MOCK_LISTS.push(newList);

    return NextResponse.json({ ...newList, errorMap }, { status: 200 });
}

// PUT — edit list (only owner or admin)
export async function PUT(req) {
    const errorMap = createErrorMap();
    const body = await req.json();

    // ✔ using _id instead of id
    const schema = { _id: "string|nonEmpty", name: "string|nonEmpty" };
    const isValid = validateDto(body, schema, errorMap, `${BASE}.update`);
    if (!isValid) return NextResponse.json({ errorMap }, { status: 400 });

    const user = await getSessionUser(req, errorMap, BASE);
    if (!user) return NextResponse.json({ errorMap }, { status: 401 });

    const userId = user.sub || user.id;
    const isAdmin = user.roles?.includes("Administrator");

    const list = MOCK_LISTS.find((l) => l._id === body._id);
    if (!list) {
        errorMap["lists.update.notFound"] = {
            type: "error",
            message: "List not found",
        };
        return NextResponse.json({ errorMap }, { status: 404 });
    }

    if (!isAdmin && list.ownerId !== userId) {
        return NextResponse.json(
            { error: "Not allowed to edit this list" },
            { status: 403 }
        );
    }

    list.name = body.name;
    list.updatedAt = new Date().toISOString();

    return NextResponse.json({ ...list, errorMap }, { status: 200 });
}

// DELETE — delete list (only owner or admin)
export async function DELETE(req) {
    const errorMap = createErrorMap();
    const listId = new URL(req.url).searchParams.get("_id"); // ✔ FIXED

    if (!listId) {
        errorMap["lists.delete._id"] = {
            type: "error",
            message: "_id is required",
        };
        return NextResponse.json({ errorMap }, { status: 400 });
    }

    const user = await getSessionUser(req, errorMap, BASE);
    if (!user) return NextResponse.json({ errorMap }, { status: 401 });

    const userId = user.sub || user.id;
    const isAdmin = user.roles?.includes("Administrator");

    const index = MOCK_LISTS.findIndex((l) => l._id === listId);

    if (index === -1) {
        errorMap["lists.delete.notFound"] = {
            type: "error",
            message: "List not found",
        };
        return NextResponse.json({ errorMap }, { status: 404 });
    }

    const list = MOCK_LISTS[index];

    if (!isAdmin && list.ownerId !== userId) {
        return NextResponse.json(
            { error: "Not allowed to delete this list" },
            { status: 403 }
        );
    }

    MOCK_LISTS.splice(index, 1);

    return NextResponse.json({ _id: listId, deleted: true, errorMap }, { status: 200 });
}