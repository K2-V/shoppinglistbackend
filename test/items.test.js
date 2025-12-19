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
    PUT,
    PATCH,
    DELETE
} = require("../app/api/items/route");

const ShoppingList =
    require("../app/api/models/ShoppingList").default ||
    require("../app/api/models/ShoppingList");

const Item =
    require("../app/api/models/Item").default ||
    require("../app/api/models/Item");

const { dbConnect } = require("../app/lib/db");

/**
 * MOCK REQUEST
 */
function mockRequest(body = {}, query = {}) {
    const qs = new URLSearchParams(query).toString();
    return {
        json: async () => body,
        url: `http://localhost/api/items${qs ? "?" + qs : ""}`,
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
let itemId;

beforeAll(async () => {
    await dbConnect();

    global.__TEST_TOKEN__ = jwt.sign(
        {
            sub: "user-id",
            roles: ["User"],
            email: "test@test.com",
            name: "Test User"
        },
        process.env.JWT_SECRET
    );

    await ShoppingList.deleteMany({});
    await Item.deleteMany({});

    const list = await ShoppingList.create({
        name: "Test list",
        ownerId: "user-id",
        members: []
    });

    listId = list._id.toString();
});

describe("Items uuCmd unit tests", () => {

    // ---------- CREATE ----------
    test("item create – happy day", async () => {
        const res = await POST(
            mockRequest({
                listId,
                name: "Milk",
                quantity: 2,
                unit: "l"
            })
        );

        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.item).toBeDefined();
        expect(body.item.name).toBe("Milk");

        itemId = body.item._id;
    });

    test("item create – validation error", async () => {
        const res = await POST(
            mockRequest({ listId })
        );

        expect(res.status).toBe(400);
    });

    // ---------- GET ----------
    test("items get – happy day", async () => {
        const res = await GET(
            mockRequest({}, { listId })
        );

        const body = await res.json();

        expect(res.status).toBe(200);
        expect(Array.isArray(body.items)).toBe(true);
        expect(body.items.length).toBe(1);
    });

    // ---------- UPDATE ----------
    test("item update – happy day", async () => {
        const res = await PUT(
            mockRequest({
                id: itemId,
                name: "Milk updated"
            })
        );

        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.item.name).toBe("Milk updated");
    });

    test("item update – not found", async () => {
        const res = await PUT(
            mockRequest({
                id: "000000000000000000000000",
                name: "X"
            })
        );

        expect(res.status).toBe(404);
    });

    // ---------- TOGGLE ----------
    test("item toggle – completed", async () => {
        const res = await PATCH(
            mockRequest({
                id: itemId,
                completed: true
            })
        );

        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.item.isCompleted).toBe(true);
    });

    // ---------- DELETE ----------
    test("item delete – happy day", async () => {
        const res = await DELETE(
            mockRequest({}, { id: itemId })
        );

        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.deleted).toBe(true);
    });

    test("item delete – not found", async () => {
        const res = await DELETE(
            mockRequest({}, { id: "000000000000000000000000" })
        );

        expect(res.status).toBe(404);
    });
});

afterAll(async () => {
    await mongoose.connection.close();
});