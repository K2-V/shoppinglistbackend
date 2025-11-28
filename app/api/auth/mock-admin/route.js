import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function GET() {
    const secret = process.env.JWT_SECRET;

    const adminUser = {
        id: "admin1",
        name: "Mock Admin",
        roles: ["Administrator"]
    };

    const token = jwt.sign(adminUser, secret, { expiresIn: "7d" });
    const res = NextResponse.json({
        message: "Mock admin logged in",
        token
    });

    res.headers.append(
        "Set-Cookie",
        `token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}`
    );

    return res;
}