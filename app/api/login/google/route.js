import { NextResponse } from "next/server";

export function GET() {
    const params = new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        redirect_uri: "http://localhost:3000/api/auth/google/callback",
        response_type: "code",
        scope: "openid email profile"
    });

    const redirectUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    return NextResponse.redirect(redirectUrl);
}