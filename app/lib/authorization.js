import { addError } from "./errorMap.js";

export function authorize(user, allowedProfiles, errorMap, baseCode) {
    if (!user) {
        addError(errorMap, `${baseCode}.auth`, "Not authenticated");
        return false;
    }

    if (user.profile === "Administrator" || (user.roles && user.roles.includes("Administrator"))) {
        return true;
    }

    const userRoles = user.roles || [user.profile];

    const ok = userRoles.some(role => allowedProfiles.includes(role));

    if (!ok) {
        addError(errorMap, `${baseCode}.forbidden`, "Not authorized");
        return false;
    }

    return true;
}