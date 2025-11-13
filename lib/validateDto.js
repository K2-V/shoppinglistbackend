import { addError } from "./errorMap.js";

export function validateDto(dto, schema, errorMap, baseCode) {
    let isValid = true;

    for (const [key, rule] of Object.entries(schema)) {
        const optional = rule.endsWith("?");
        const [type, customCheck] = rule.replace("?", "").split("|");
        const value = dto[key];

        if (value === undefined || value === null) {
            if (!optional) {
                addError(errorMap, `${baseCode}.${key}`, `${key} is required`);
                isValid = false;
            }
            continue;
        }

        if (type === "string" && typeof value !== "string") {
            addError(errorMap, `${baseCode}.${key}`, `${key} must be string`);
            isValid = false;
        }

        if (type === "number" && typeof value !== "number") {
            addError(errorMap, `${baseCode}.${key}`, `${key} must be number`);
            isValid = false;
        }

        if (customCheck === "nonEmpty" && typeof value === "string" && !value.trim()) {
            addError(errorMap, `${baseCode}.${key}`, `${key} cannot be empty`);
            isValid = false;
        }

        if (type === "boolean" && typeof value !== "boolean") {
            addError(errorMap, `${baseCode}.${key}`, `${key} must be boolean`);
            isValid = false;
        }
    }

    return isValid;
}