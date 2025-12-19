module.exports = {
    testEnvironment: "node",
    transform: {
        "^.+\\.js$": "babel-jest"
    },
    moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/$1"
    }
};