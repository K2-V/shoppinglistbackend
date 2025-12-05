import { NextResponse } from "next/server";
import { createErrorMap } from "@/app/lib/errorMap";
import { validateDto } from "@/app/lib/validateDto";
import { getSessionUser } from "@/app/lib/auth";
import { authorize } from "@/app/lib/authorization";
import { dbConnect } from "@/app/lib/db";

import ShoppingList from "../../api/models/ShoppingList";
const BASE = "lists";

/** GET — user sees only their lists, admin sees all */
export async function GET(req) {
    await dbConnect();
    const errorMap = createErrorMap();

    const user = await getSessionUser(req, errorMap, BASE);
    if (!user) return NextResponse.json({ errorMap }, { status: 401 });

    const ok = authorize(user, ["User", "Administrator"], errorMap, BASE);
    if (!ok) return NextResponse.json({ errorMap }, { status: 403 });

    const userId = user.sub || user.id;
    const isAdmin = user.roles?.includes("Administrator");

    const { searchParams } = new URL(req.url);
    const listId = searchParams.get("id");

    if (listId) {
        const list = await ShoppingList.findById(listId);

        if (!list) {
            errorMap["lists.get.notFound"] = {
                type: "error",
                message: "List not found",
            };
            return NextResponse.json({ errorMap }, { status: 404 });
        }

        const isOwner = list.ownerId === userId;
        const isMember =
            Array.isArray(list.members) && list.members.includes(userId);

        if (!isAdmin && !isOwner && !isMember) {
            return NextResponse.json(
                { error: "Not allowed to access this list" },
                { status: 403 }
            );
        }

        return NextResponse.json({ list, errorMap }, { status: 200 });
    }
    const lists = isAdmin
        ? await ShoppingList.find({})
        : await ShoppingList.find({
            $or: [
                { ownerId: userId },
                { members: userId },
            ],
        });

    return NextResponse.json({ lists, errorMap }, { status: 200 });
}

/** POST — create new list under logged user */
export async function POST(req) {
    await dbConnect();
    const errorMap = createErrorMap();

    const body = await req.json();
    const schema = { name: "string|nonEmpty" };

    const isValid = validateDto(body, schema, errorMap, "lists.create");
    if (!isValid) return NextResponse.json({ errorMap }, { status: 400 });

    const user = await getSessionUser(req, errorMap, "lists");
    if (!user) return NextResponse.json({ errorMap }, { status: 401 });

    const userId = user.sub || user.id;

    const newList = await ShoppingList.create({
        name: body.name,
        ownerId: userId,
    });

    return NextResponse.json({ list: newList, errorMap }, { status: 200 });
}

/** PUT — edit list (only owner or admin) */
export async function PUT(req) {
    await dbConnect();
    const errorMap = createErrorMap();

    const { searchParams } = new URL(req.url);
    const listId = searchParams.get("id");

    if (!listId) {
        errorMap["lists.update._id"] = {
            type: "error",
            message: "_id is required in query (?id=)",
        };
        return NextResponse.json({ errorMap }, { status: 400 });
    }

    const body = await req.json();

    const schema = {
        name: "string|nonEmpty",
    };

    const isValid = validateDto(body, schema, errorMap, "lists.update");
    if (!isValid) return NextResponse.json({ errorMap }, { status: 400 });

    const user = await getSessionUser(req, errorMap, "lists");
    if (!user) return NextResponse.json({ errorMap }, { status: 401 });

    const userId = user.sub || user.id;
    const isAdmin = user.roles?.includes("Administrator");

    const existing = await ShoppingList.findById(listId);
    if (!existing) {
        errorMap["lists.update.notFound"] = {
            type: "error",
            message: "List not found",
        };
        return NextResponse.json({ errorMap }, { status: 404 });
    }

    if (!isAdmin && existing.ownerId.toString() !== userId) {
        return NextResponse.json(
            { error: "Not allowed to edit this list" },
            { status: 403 }
        );
    }
    existing.name = body.name;
    existing.updatedAt = new Date();
    existing.updatedBy = userId;

    await existing.save();

    return NextResponse.json({ list: existing, errorMap }, { status: 200 });
}

/** DELETE — delete list (only owner or admin) */
export async function DELETE(req) {
    await dbConnect();
    const errorMap = createErrorMap();

    const listId = new URL(req.url).searchParams.get("id");
    if (!listId) {
        errorMap["lists.delete._id"] = {
            type: "error",
            message: "_id is required",
        };
        return NextResponse.json({ errorMap }, { status: 400 });
    }

    const user = await getSessionUser(req, errorMap, "lists");
    if (!user) return NextResponse.json({ errorMap }, { status: 401 });

    const userId = user.sub || user.id;
    const isAdmin = user.roles?.includes("Administrator");

    const list = await ShoppingList.findById(listId);
    if (!list) {
        errorMap["lists.delete.notFound"] = {
            type: "error",
            message: "List not found",
        };
        return NextResponse.json({ errorMap }, { status: 404 });
    }

    if (!isAdmin && list.ownerId.toString() !== userId) {
        return NextResponse.json(
            { error: "Not allowed to delete this list" },
            { status: 403 }
        );
    }

    await ShoppingList.deleteOne({ _id: listId });

    return NextResponse.json(
        { _id: listId, deleted: true, errorMap },
        { status: 200 }
    );
}