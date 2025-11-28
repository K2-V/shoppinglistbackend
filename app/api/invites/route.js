import { NextResponse } from "next/server";
import { createErrorMap } from "@/app/lib/errorMap";
import { validateDto } from "@/app/lib/validateDto";
import { getSessionUser } from "@/app/lib/auth";


const BASE = "invites";

const SPECIAL_USER_ID = "108195485435091122559";
const SECOND_USER_ID = "117745167204614174119";

// Helper for mock ObjectId
function mockObjectId() {
    return `id_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
}

// MOCK INVITES
export const MOCK_INVITES = [
    {
        _id: mockObjectId(),
        userId: SECOND_USER_ID,
        listId: "id_1764340122289_1140",
        shoppingListId: "id_1764340122289_1140",
        role: "member",
        accepted: false
    }
];

// POST – CREATE INVITE
export async function POST(req) {
    const errorMap = createErrorMap();
    const body = await req.json();

    const schema = {
        shoppingListId: "string|nonEmpty",
        userId: "string|nonEmpty",
        role: "string?",           // default "member"
    };

    const isValid = validateDto(body, schema, errorMap, `${BASE}.create`);
    if (!isValid) return NextResponse.json({ errorMap }, { status: 400 });

    // Auth
    const user = await getSessionUser(req, errorMap, BASE);
    if (!user) return NextResponse.json({ errorMap }, { status: 401 });

    const userId = user.sub || user.id;
    const isAdmin = user.roles?.includes("Administrator");

    // Only SPECIAL user or admin can send invites for his lists
    if (!isAdmin && userId !== SPECIAL_USER_ID) {
        return NextResponse.json(
            { error: "You are not allowed to send invitations" },
            { status: 403 }
        );
    }

    const newInvite = {
        _id: `inv_${Date.now()}`,
        shoppingListId: body.shoppingListId,
        userId: body.userId,
        listId: body.shoppingListId,
        role: body.role || "member",
        accepted: false,
    };

    MOCK_INVITES.push(newInvite);

    return NextResponse.json({ invite: newInvite, errorMap }, { status: 200 });
}

// GET – CURRENT USER INVITES
export async function GET(req) {
    const errorMap = createErrorMap();
    const user = await getSessionUser(req, errorMap, BASE);
    if (!user) return NextResponse.json({ errorMap }, { status: 401 });

    const userId = user.sub || user.id;
    const isAdmin = user.roles?.includes("Administrator");

    const invites = isAdmin
        ? MOCK_INVITES
        : MOCK_INVITES.filter(i => i.userId === userId);

    return NextResponse.json({ invites, errorMap }, { status: 200 });
}

// PATCH – ACCEPT INVITE /api/invites?id=inviteId
export async function PATCH(req) {
    const errorMap = createErrorMap();
    const { searchParams } = new URL(req.url);

    const id = searchParams.get("id");
    if (!id) {
        errorMap["invites.accept.id"] = {
            type: "error",
            message: "invite id is required"
        };
        return NextResponse.json({ errorMap }, { status: 400 });
    }

    // Auth
    const user = await getSessionUser(req, errorMap, BASE);
    if (!user) return NextResponse.json({ errorMap }, { status: 401 });

    const userId = user.sub || user.id;

    const invite = MOCK_INVITES.find(i => i._id === id);
    if (!invite) {
        return NextResponse.json(
            { error: "Invite not found" },
            { status: 404 }
        );
    }

    // Only the receiver can accept
    if (invite.userId !== userId) {
        return NextResponse.json(
            { error: "You cannot accept someone else's invite" },
            { status: 403 }
        );
    }

    invite.accepted = true;

    return NextResponse.json(
        { message: "Invite accepted", invite },
        { status: 200 }
    );
}