import { addError } from "./errorMap.js";

export function authorize(user, allowedProfiles, errorMap, baseCode) {
    if (!user) return false;

    if (user.profile === "Administrator") return true; // full access

    if (!allowedProfiles.includes(user.profile)) {
        addError(errorMap, `${baseCode}.authz`, "User not authorized");
        return false;
    }

    return true;
}