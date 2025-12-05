import { NextResponse } from "next/server";
import { createErrorMap } from "@/app/lib/errorMap";
import { getSessionUser } from "@/app/lib/auth";
import { dbConnect } from "@/app/lib/db";
import ShoppingList from "@/app/api/models/ShoppingList";

const BASE = "lists.leave";

export async function PATCH(req) {
    await dbConnect();
    const errorMap = createErrorMap();

    const { searchParams } = new URL(req.url);
    const listId = searchParams.get("id");

    if (!listId) {
        errorMap["lists.leave.id"] = {
            type: "error",
            message: "id (listId) is required",
        };
        return NextResponse.json({ errorMap }, { status: 400 });
    }

    const user = await getSessionUser(req, errorMap, BASE);
    if (!user) return NextResponse.json({ errorMap }, { status: 401 });

    const userId = user.sub || user.id;

    const list = await ShoppingList.findById(listId);
    if (!list) {
        errorMap["lists.leave.notFound"] = {
            type: "error",
            message: "List not found",
        };
        return NextResponse.json({ errorMap }, { status: 404 });
    }

    if (list.ownerId?.toString() === userId) {
        return NextResponse.json(
            { error: "Owner cannot leave own list – delete or change owner instead." },
            { status: 400 }
        );
    }

    const isMember =
        Array.isArray(list.members) && list.members.includes(userId);

    if (!isMember) {
        return NextResponse.json(
            { error: "You are not a member of this list." },
            { status: 403 }
        );
    }

    await ShoppingList.updateOne(
        { _id: listId },
        { $pull: { members: userId } }
    );

    return NextResponse.json(
        { listId, left: true, errorMap },
        { status: 200 }
    );
}