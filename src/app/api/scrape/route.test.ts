/**
 * Unit Tests for /api/scrape (POST)
 */
jest.mock("next-auth", () => ({ getServerSession: jest.fn() }));
jest.mock("@/lib/auth", () => ({ authOptions: {} }));
jest.mock("@/lib/video", () => ({
    extractVideoFromUrl: jest.fn().mockResolvedValue(null),
}));

const mockFetch = jest.fn();
global.fetch = mockFetch;

import { POST } from "./route";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";

const mkReq = (url: string): NextRequest => {
    return {
        json: jest.fn().mockResolvedValue({ url }),
    } as unknown as NextRequest;
};

describe("POST /api/scrape", () => {
    afterEach(() => jest.clearAllMocks());

    it("returns 401 if unauthenticated", async () => {
        (getServerSession as jest.Mock).mockResolvedValue(null);
        expect((await POST(mkReq("https://example.com"))).status).toBe(401);
    });

    it("returns 400 for invalid url", async () => {
        (getServerSession as jest.Mock).mockResolvedValue({ user: { id: "u1" } });
        const res = await POST(mkReq("invalid-url"));
        expect(res.status).toBe(400);
    });

    it("scrapes YouTube successfully", async () => {
        (getServerSession as jest.Mock).mockResolvedValue({ user: { id: "u1" } });
        mockFetch.mockResolvedValueOnce({
            ok: true,
            text: () => Promise.resolve(`
                <html>
                    <head>
                        <title>My YouTube Video - YouTube</title>
                        <meta name="description" content="Check out my cool video #new #viral">
                    </head>
                </html>
            `),
        });

        const res = await POST(mkReq("https://youtube.com/watch?v=123"));
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.title).toBe("My YouTube Video");
        expect(data.hashtags).toContain("#new");
    });

    it("scrapes MH Estate successfully via XML fallback", async () => {
        (getServerSession as jest.Mock).mockResolvedValue({ user: { id: "u1" } });
        mockFetch.mockResolvedValueOnce({
            ok: true,
            text: () => Promise.resolve(`
                <propiedades>
                    <propiedad>
                        <id>27603199</id>
                        <tipo_inmueble><![CDATA[Beautiful Mansion]]></tipo_inmueble>
                        <zona><![CDATA[Marbella]]></zona>
                        <descripcion_es><![CDATA[Stunning palace in Marbella]]></descripcion_es>
                        <precioinmo>4500000</precioinmo>
                        <url_web_es><![CDATA[https://mhestate.es/prop/27603199]]></url_web_es>
                        <imagenes><imagen><![CDATA[https://mhestate.es/img1.jpg]]></imagen></imagenes>
                    </propiedad>
                </propiedades>
            `),
        });

        const res = await POST(mkReq("https://mhestate.es/property-detail?id=27603199"));
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.title).toBe("Beautiful Mansion - Marbella");
        expect(data.price).toBe("4500000");
    });
});
