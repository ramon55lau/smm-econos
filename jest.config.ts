import type { Config } from "jest";
import nextJest from "next/jest.js";

const createJestConfig = nextJest({
    dir: "./",
});

const config: Config = {
    displayName: "SMM API Tests",
    testEnvironment: "node",
    testMatch: ["**/src/**/*.test.ts", "**/src/**/*.test.tsx"],
    moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/src/$1",
    },
    modulePathIgnorePatterns: [
        "<rootDir>/.next/",
        "<rootDir>/node_modules/",
        "<rootDir>/tmp/",
    ],
    setupFilesAfterEnv: [],
    resetMocks: true,
    clearMocks: true,
};

export default createJestConfig(config);
