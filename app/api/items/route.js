import { NextResponse } from "next/server";
import { createErrorMap } from "@/app/lib/errorMap";
import { validateDto } from "@/app/lib/validateDto";
import { getSessionUser } from "@/app/lib/auth";
import { dbConnect } from "@/app/lib/db";
import ShoppingList from "@/app/api/models/ShoppingList";
import Item from "../../api/models/Item";

const BASE = "items";

/** GET — /api/items?listId= */
export async function GET(req) {
    await dbConnect();
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

    const list = await ShoppingList.findById(listId);
    if (!list)
        return NextResponse.json({ error: "List not found" }, { status: 404 });

    const isOwner = list.ownerId?.toString() === userId;
    const isMember = list.members?.includes(userId);

    if (!isAdmin && !isOwner && !isMember)
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const items = await Item.find({ listId });

    return NextResponse.json({ items, errorMap }, { status: 200 });
}

/** POST — Create new item */
export async function POST(req) {
    await dbConnect();
    const errorMap = createErrorMap();
    const body = await req.json();

    const schema = {
        listId: "string|nonEmpty",
        name: "string|nonEmpty",
        quantity: "number?",
        unit: "string?",
        note: "string?",
    };

    if (!validateDto(body, schema, errorMap, `${BASE}.create`))
        return NextResponse.json({ errorMap }, { status: 400 });

    const user = await getSessionUser(req, errorMap, BASE);
    if (!user) return NextResponse.json({ errorMap }, { status: 401 });

    const userId = user.sub || user.id;

    const newItem = await Item.create({
        listId: body.listId,
        name: body.name,
        quantity: body.quantity ?? 1,
        unit: body.unit ?? "",
        note: body.note ?? "",
        addedBy: userId,
        isCompleted: false,
        completedBy: null,
    });

    return NextResponse.json({ item: newItem, errorMap }, { status: 200 });
}

/** PUT — Update item */
export async function PUT(req) {
    await dbConnect();
    const errorMap = createErrorMap();
    const body = await req.json();

    const schema = {
        id: "string|nonEmpty",
        name: "string?",
        quantity: "number?",
        unit: "string?",
        note: "string?"
    };

    if (!validateDto(body, schema, errorMap, `${BASE}.update`)) {
        return NextResponse.json({ errorMap }, { status: 400 });
    }

    const user = await getSessionUser(req, errorMap, BASE);
    if (!user) return NextResponse.json({ errorMap }, { status: 401 });

    const userId = user.sub || user.id;
    const isAdmin = user.roles?.includes("Administrator");

    const item = await Item.findById(body.id);
    if (!item) {
        return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const list = await ShoppingList.findById(item.listId);
    if (!list) {
        return NextResponse.json({ error: "List not found" }, { status: 404 });
    }

    const isOwner = list.ownerId.toString() === userId;

    if (!isAdmin && !isOwner && item.addedBy.toString() !== userId) {
        return NextResponse.json(
            { error: "Not allowed to edit this item" },
            { status: 403 }
        );
    }

    if (body.name !== undefined) item.name = body.name;
    if (body.quantity !== undefined) item.quantity = body.quantity;
    if (body.unit !== undefined) item.unit = body.unit;
    if (body.note !== undefined) item.note = body.note;

    item.updatedAt = new Date();
    await item.save();

    return NextResponse.json({ item, errorMap }, { status: 200 });
}

/** PATCH — Toggle completed (member → allowed for ALL items) */
export async function PATCH(req) {
    await dbConnect();
    const errorMap = createErrorMap();
    const body = await req.json();

    const schema = { id: "string|nonEmpty", completed: "boolean" };
    if (!validateDto(body, schema, errorMap, `${BASE}.toggle`))
        return NextResponse.json({ errorMap }, { status: 400 });

    const user = await getSessionUser(req, errorMap, BASE);
    if (!user) return NextResponse.json({ errorMap }, { status: 401 });
    const userId = user.sub || user.id;

    const item = await Item.findById(body.id);
    if (!item)
        return NextResponse.json({ error: "Item not found" }, { status: 404 });

    item.isCompleted = body.completed;
    item.completedBy = body.completed ? userId : null;
    item.updatedAt = new Date();
    await item.save();

    return NextResponse.json({ item, errorMap }, { status: 200 });
}

/** DELETE — Delete item */
export async function DELETE(req) {
    await dbConnect();
    const errorMap = createErrorMap();

    const id = new URL(req.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const user = await getSessionUser(req, errorMap, BASE);
    if (!user) return NextResponse.json({ errorMap }, { status: 401 });

    const userId = user.sub || user.id;
    const isAdmin = user.roles?.includes("Administrator");

    const item = await Item.findById(id);
    if (!item)
        return NextResponse.json({ error: "Item not found" }, { status: 404 });

    const list = await ShoppingList.findById(item.listId);
    if (!list)
        return NextResponse.json({ error: "List not found" }, { status: 404 });

    const isOwner = list.ownerId.toString() === userId;

    if (!isAdmin && !isOwner && item.addedBy.toString() !== userId) {
        return NextResponse.json(
            { error: "Not allowed to delete this item" },
            { status: 403 }
        );
    }

    await Item.deleteOne({ _id: id });

    return NextResponse.json({ id, deleted: true, errorMap }, { status: 200 });
}