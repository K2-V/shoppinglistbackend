import { NextResponse } from "next/server";
import { getSessionUser } from "@/app/lib/auth";
import { dbConnect } from "@/app/lib/db";
import User from "@/app/api/models/User";

export async function GET(req) {
    await dbConnect();

    const errorMap = {};

    const sessionUser = await getSessionUser(req, errorMap, "auth");
    if (!sessionUser) {
        return NextResponse.json({ user: null, errorMap }, { status: 200 });
    }

    const { sub, email, name, picture } = sessionUser;

    let user = await User.findById(sub);

    if (!user) {
        user = await User.create({
            _id: sub,
            email,
            name,
            picture,
            roles: ["User"],
        });
    } else {
        user.name = name;
        user.picture = picture;
        user.updatedAt = new Date();
        await user.save();
    }

    return NextResponse.json({ user, errorMap }, { status: 200 });
}