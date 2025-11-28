import jwt from "jsonwebtoken";
import { addError } from "./errorMap.js";

export async function getSessionUser(req, errorMap = {}, baseCode = "auth") {
    const cookie = req.headers.get("cookie") || "";

    const token = cookie
        .split(";")
        .map((c) => c.trim())
        .find((c) => c.startsWith("token="))
        ?.split("=")[1];

    if (!token) {
        addError(errorMap, `${baseCode}.auth`, "Missing authentication token");
        return null;
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        return decoded;

    } catch (e) {
        addError(errorMap, `${baseCode}.auth`, "Invalid or expired token");
        return null;
    }
}