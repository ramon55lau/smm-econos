/**
 * Unit Tests for /api/auth/[...nextauth] (route.ts)
 */
jest.mock("next-auth", () => jest.fn(() => "next-auth-handler"));
jest.mock("@/lib/auth", () => ({ authOptions: {} }));

import { GET, POST } from "./route";

describe("NextAuth Route Handler", () => {
    it("should export GET and POST handlers created by NextAuth", () => {
        expect(GET).toBe("next-auth-handler");
        expect(POST).toBe("next-auth-handler");
    });
});
