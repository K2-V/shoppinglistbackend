import { NextResponse } from "next/server";

export function GET() {
    const params = new URLSearchParams({
        client_id: process.env.GITHUB_ID,
        redirect_uri: "http://localhost:3000/api/auth/github/callback",
        scope: "read:user user:email"
    });

    const redirectUrl = `https://github.com/login/oauth/authorize?${params.toString()}`;
    return NextResponse.redirect(redirectUrl);
}