import { NextResponse } from "next/server";

export async function GET() {
    return new NextResponse(null, {
        status: 302,
        headers: {
            "Set-Cookie": `token=; HttpOnly; Path=/; Max-Age=0`,
            "Location": "/"
        },
    });
}