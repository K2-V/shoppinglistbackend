import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";

const users = [];
let initialized = false;

export function initPassport() {
    if (initialized) return passport;

    // ---------- GOOGLE ----------
    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
        passport.use(
            new GoogleStrategy(
                {
                    clientID: process.env.GOOGLE_CLIENT_ID,
                    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                    callbackURL: "http://localhost:3000/api/auth/google/callback",
                },
                (accessToken, refreshToken, profile, done) => {
                    let user = users.find((u) => u.providerId === profile.id);

                    if (!user) {
                        user = {
                            id: profile.id,
                            providerId: profile.id,
                            email: profile.emails?.[0]?.value ?? "",
                            name: profile.displayName,
                            roles: ["User"],
                        };
                        users.push(user);
                    }

                    done(null, user);
                }
            )
        );
    }

    // ---------- GITHUB ----------
    if (process.env.GITHUB_ID && process.env.GITHUB_SECRET) {
        passport.use(
            new GitHubStrategy(
                {
                    clientID: process.env.GITHUB_ID,
                    clientSecret: process.env.GITHUB_SECRET,
                    callbackURL: "http://localhost:3000/api/auth/github/callback",
                },
                (accessToken, refreshToken, profile, done) => {
                    let user = users.find((u) => u.providerId === profile.id);

                    if (!user) {
                        user = {
                            id: profile.id,
                            providerId: profile.id,
                            email: profile.emails?.[0]?.value ?? "",
                            name: profile.displayName,
                            roles: ["User"],
                        };
                        users.push(user);
                    }

                    done(null, user);
                }
            )
        );
    }

    initialized = true;
    return passport;
}