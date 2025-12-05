import { NextResponse } from "next/server";
import { createErrorMap } from "@/app/lib/errorMap";
import { validateDto } from "@/app/lib/validateDto";
import { getSessionUser } from "@/app/lib/auth";
import { dbConnect } from "@/app/lib/db";

import Invite from "@/app/api/models/Invites";
import ShoppingList from "@/app/api/models/ShoppingList";

const BASE = "invites";

/** GET – INVITES CURRENT USER */
export async function GET(req) {
    await dbConnect();
    const errorMap = createErrorMap();

    const user = await getSessionUser(req, errorMap, BASE);
    if (!user) return NextResponse.json({ errorMap }, { status: 401 });

    const userId = user.sub || user.id;
    const isAdmin = user.roles?.includes("Administrator");

    const invites = isAdmin
        ? await Invite.find()
        : await Invite.find({ userId });

    return NextResponse.json({ invites, errorMap }, { status: 200 });
}

/** PATCH – ACCEPT INVITE /api/invites?id=inviteId */
export async function PATCH(req) {
    await dbConnect();
    const errorMap = createErrorMap();
    const { searchParams } = new URL(req.url);

    const id = searchParams.get("id");
    if (!id) {
        errorMap["invites.accept.id"] = {
            type: "error",
            message: "invite id is required",
        };
        return NextResponse.json({ errorMap }, { status: 400 });
    }

    const user = await getSessionUser(req, errorMap, BASE);
    if (!user) return NextResponse.json({ errorMap }, { status: 401 });

    const userId = user.sub || user.id;

    const invite = await Invite.findById(id);
    if (!invite) {
        return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    }

    if (invite.userId !== userId) {
        return NextResponse.json(
            { error: "You cannot accept someone else's invite" },
            { status: 403 }
        );
    }

    invite.accepted = true;
    invite.acceptedAt = new Date();
    await invite.save();

    await ShoppingList.updateOne(
        { _id: invite.shoppingListId },
        { $addToSet: { members: userId } }
    );

    return NextResponse.json(
        { message: "Invite accepted", invite },
        { status: 200 }
    );
}

/** POST — CREATE INVITE */
export async function POST(req) {
    await dbConnect();
    const errorMap = createErrorMap();
    const body = await req.json();

    const schema = {
        shoppingListId: "string|nonEmpty",
        userId: "string|nonEmpty",
        role: "string?",
    };

    const isValid = validateDto(body, schema, errorMap, `${BASE}.create`);
    if (!isValid) return NextResponse.json({ errorMap }, { status: 400 });

    const user = await getSessionUser(req, errorMap, BASE);
    if (!user) return NextResponse.json({ errorMap }, { status: 401 });

    const currentUserId = user.sub || user.id;
    const isAdmin = user.roles?.includes("Administrator");

    const list = await ShoppingList.findById(body.shoppingListId);
    if (!list) {
        return NextResponse.json({ error: "List not found" }, { status: 404 });
    }

    if (!isAdmin && list.ownerId !== currentUserId) {
        return NextResponse.json(
            { error: "You are not allowed to send invitations for this list" },
            { status: 403 }
        );
    }

    const invite = await Invite.create({
        userId: body.userId,
        shoppingListId: body.shoppingListId,
        listId: body.shoppingListId,
        role: body.role || "member",
        accepted: false,
    });

    return NextResponse.json({ invite, errorMap }, { status: 200 });
}

