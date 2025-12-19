import { initPassport } from "../../../../lib/passport";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

export async function GET(req) {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");

    return new Promise((resolve) => {
        passport.authenticate("github", async (err, user) => {
            if (err || !user) {
                return resolve(
                    NextResponse.json(
                        { error: "GitHub authentication failed" },
                        { status: 400 }
                    )
                );
            }

            const token = jwt.sign(
                { sub: user.id, roles: user.roles, provider: "github" },
                process.env.JWT_SECRET,
                { expiresIn: "7d" }
            );

            resolve(
                new NextResponse(null, {
                    status: 302,
                    headers: {
                        "Set-Cookie": `token=${token}; HttpOnly; Path=/; Max-Age=604800`,
                        Location: "/",
                    },
                })
            );
        })({
            query: { code },
        });
    });
}