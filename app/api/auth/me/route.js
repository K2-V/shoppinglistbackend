import { getSessionUser } from "@/app/lib/auth";

export async function GET(req) {
    const user = await getSessionUser(req);

    if (!user) {
        return new Response(JSON.stringify({ error: "Not authenticated" }), {
            status: 401,
            headers: { "Content-Type": "application/json" }
        });
    }

    return new Response(JSON.stringify({ user }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
    });
}
