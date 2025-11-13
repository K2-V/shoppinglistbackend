import { NextResponse } from "next/server";
import { createErrorMap } from "@/lib/errorMap";
import { validateDto } from "@/lib/validateDto";
import { getSessionUser } from "@/lib/auth";
import { authorize } from "@/lib/authorization";

const BASE = "invites";

// 🧱 Mock pozvánky
export const MOCK_INVITES = [
    // Každý objekt představuje pozvánku
    { id: "invite1", listId: "list1-1", fromUser: "user1", toUser: "user2", status: "pending" },
    { id: "invite2", listId: "list2-3", fromUser: "user2", toUser: "user3", status: "accepted" },
];

export async function POST(req) {
    const errorMap = createErrorMap();
    const body = await req.json();

    const schema = {
        listId: "string|nonEmpty",
        toUser: "string|nonEmpty", // id uživatele, kterého zveme
    };
    const isValid = validateDto(body, schema, errorMap, `${BASE}.create`);
    if (!isValid) return NextResponse.json({ errorMap }, { status: 400 });

    const user = await getSessionUser(req, errorMap, BASE);
    if (!user) return NextResponse.json({ errorMap }, { status: 401 });

    const ok = authorize(user, ["User", "Administrator"], errorMap, BASE);
    if (!ok) return NextResponse.json({ errorMap }, { status: 403 });

    const newInvite = {
        id: `invite-${Date.now()}`,
        listId: body.listId,
        fromUser: user.id,
        toUser: body.toUser,
        status: "pending",
    };
    MOCK_INVITES.push(newInvite);

    return NextResponse.json({ ...newInvite, errorMap }, { status: 200 });
}

export async function GET(req) {
    const errorMap = createErrorMap();
    const user = await getSessionUser(req, errorMap, BASE);
    if (!user) return NextResponse.json({ errorMap }, { status: 401 });

    // zobrazí všechny pozvánky, kde je uživatel odesílatel nebo příjemce
    const invites =
        user.profile === "Administrator"
            ? MOCK_INVITES
            : MOCK_INVITES.filter((i) => i.fromUser === user.id || i.toUser === user.id);

    return NextResponse.json({ invites, errorMap }, { status: 200 });
}