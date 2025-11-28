import { cookies } from "next/headers";
import ShoppingListWrapper from "./ShoppingListsWrapper";

export default async function Home() {
    let user = null;

    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (token) {
        try {
            const res = await fetch("http://localhost:3000/api/auth/me", {
                cache: "no-store",
                headers: {
                    Cookie: `token=${token}`,
                },
            });

            if (res.ok) {
                const data = await res.json();
                user = data.user;
            }
        } catch {
            user = null;
        }
    }

    return (
        <div style={{ padding: 40 }}>
            <h1>Login page</h1>

            {user ? (
                <>
                    <p>
                        <b>Login User:</b>{" "}
                        {user.name || user.sub} ({user.roles?.join(", ")})
                    </p>
                    {user.provider && (
                        <p><b>Provider:</b> {user.provider}</p>
                    )}

                    <ShoppingListWrapper />
                </>
            ) : (
                <>
                    <a href="/api/login/google">
                        <button>Log in with Google</button>
                    </a>

                    <a href="/api/login/github" style={{ marginLeft: 10 }}>
                        <button>Log in with GitHub</button>
                    </a>
                </>
            )}

            <a href="/api/auth/logout">
                <button>Logout</button>
            </a>
        </div>
    );
}