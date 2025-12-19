jest.setTimeout(20000);

const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

/**
 * MOCK cookies() – JWT z cookie
 */
jest.mock("next/headers", () => ({
    cookies: () => ({
        get: (name) => {
            if (name === "token") {
                return { value: global.__TEST_TOKEN__ };
            }
            return null;
        }
    })
}));

/**
 * IMPORT uuCmd
 */
const {
    GET,
    POST,
    PATCH
} = require("../app/api/invites/route");

const Invite =
    require("../app/api/models/Invites").default ||
    require("../app/api/models/Invites");

const ShoppingList =
    require("../app/api/models/ShoppingList").default ||
    require("../app/api/models/ShoppingList");

const { dbConnect } = require("../app/lib/db");

/**
 * MOCK REQUEST
 */
function mockRequest(body = {}, query = {}) {
    const qs = new URLSearchParams(query).toString();
    return {
        json: async () => body,
        url: `http://localhost/api/invites${qs ? "?" + qs : ""}`,
        headers: {
            get: (name) => {
                if (name === "cookie") {
                    return `token=${global.__TEST_TOKEN__}`;
                }
                return null;
            }
        }
    };
}

/**
 * JWT
 */
process.env.JWT_SECRET = "test-secret";

let listId;
let inviteId;

beforeAll(async () => {
    await dbConnect();

    // OWNER
    global.__TEST_TOKEN__ = jwt.sign(
        {
            sub: "owner-id",
            roles: ["User"],
            email: "owner@test.com",
            name: "Owner"
        },
        process.env.JWT_SECRET
    );

    await Invite.deleteMany({});
    await ShoppingList.deleteMany({});

    const list = await ShoppingList.create({
        name: "Invite test list",
        ownerId: "owner-id",
        members: []
    });

    listId = list._id.toString();
});

describe("Invites uuCmd unit tests", () => {

    // ---------- CREATE ----------
    test("invite create – happy day (owner)", async () => {
        const res = await POST(
            mockRequest({
                shoppingListId: listId,
                userId: "member-id"
            })
        );

        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.invite).toBeDefined();
        expect(body.invite.userId).toBe("member-id");

        inviteId = body.invite._id;
    });

    test("invite create – forbidden (not owner)", async () => {
        global.__TEST_TOKEN__ = jwt.sign(
            { sub: "someone-else", roles: ["User"] },
            process.env.JWT_SECRET
        );

        const res = await POST(
            mockRequest({
                shoppingListId: listId,
                userId: "x"
            })
        );

        expect(res.status).toBe(403);
    });

    // ---------- GET ----------
    test("invites get – user sees only own invites", async () => {
        global.__TEST_TOKEN__ = jwt.sign(
            { sub: "member-id", roles: ["User"] },
            process.env.JWT_SECRET
        );

        const res = await GET(mockRequest());
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(Array.isArray(body.invites)).toBe(true);
        expect(body.invites.length).toBe(1);
    });

    // ---------- ACCEPT ----------
    test("invite accept – happy day", async () => {
        const res = await PATCH(
            mockRequest({}, { id: inviteId })
        );

        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.invite.accepted).toBe(true);

        const list = await ShoppingList.findById(listId);
        expect(list.members).toContain("member-id");
    });

    test("invite accept – forbidden (wrong user)", async () => {
        global.__TEST_TOKEN__ = jwt.sign(
            { sub: "evil-user", roles: ["User"] },
            process.env.JWT_SECRET
        );

        const res = await PATCH(
            mockRequest({}, { id: inviteId })
        );

        expect(res.status).toBe(403);
    });

    test("invite accept – not found", async () => {
        global.__TEST_TOKEN__ = jwt.sign(
            { sub: "member-id", roles: ["User"] },
            process.env.JWT_SECRET
        );

        const res = await PATCH(
            mockRequest({}, { id: "000000000000000000000000" })
        );

        expect(res.status).toBe(404);
    });
});

afterAll(async () => {
    await mongoose.connection.close();
});