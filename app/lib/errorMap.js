export function createErrorMap() {
    return {};
}

export function addError(errorMap, code, message, type = "error") {
    errorMap[code] = { type, message };
}