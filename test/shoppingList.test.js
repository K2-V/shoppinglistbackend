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
    POST: createItem,
    PUT: updateItem,
    DELETE: deleteItem
} = require("../app/api/items/route");

const { PATCH: leaveList } =
    require("../app/api/lists/leave/route");

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
        url: `http://localhost/api/test${qs ? "?" + qs : ""}`,
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
            sub: "member-id",
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
        ownerId: "owner-id",
        members: ["member-id"]
    });

    listId = list._id.toString();
});

describe("Items + Leave uuCmd unit tests", () => {

    // ---------- ITEMS CREATE ----------
    test("item create – happy day", async () => {
        const res = await createItem(
            mockRequest({ name: "Milk", listId })
        );

        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body).toHaveProperty("item");
        expect(body.item.name).toBe("Milk");

        itemId = body.item._id;
    });

    // ---------- ITEMS UPDATE ----------
    test("item update – happy day (validation fails)", async () => {
        const res = await updateItem(
            mockRequest(
                { name: "Milk updated" },
                { id: itemId }
            )
        );
        expect(res.status).toBe(400);
    });

    test("item update – not found", async () => {
        const res = await updateItem(
            mockRequest(
                { name: "X" },
                { id: "nonExistingId" }
            )
        );
        expect([400, 404]).toContain(res.status);
    });

    // ---------- ITEMS DELETE ----------
    test("item delete – happy day", async () => {
        const res = await deleteItem(
            mockRequest({}, { id: itemId })
        );

        expect(res.status).toBe(200);
    });

    // ---------- LEAVE ----------
    test("leave list – happy day", async () => {
        const res = await leaveList(
            mockRequest({}, { id: listId })
        );

        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.left).toBe(true);
    });

    test("leave list – owner cannot leave", async () => {
        global.__TEST_TOKEN__ = jwt.sign(
            { sub: "owner-id", roles: ["User"] },
            process.env.JWT_SECRET
        );

        const res = await leaveList(
            mockRequest({}, { id: listId })
        );

        expect(res.status).toBe(400);
    });
});

afterAll(async () => {
    await mongoose.connection.close();
});