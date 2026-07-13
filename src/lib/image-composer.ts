import sharp from "sharp";
import fs from "fs";
import path from "path";
import os from "os";
import { randomUUID } from "crypto";

const UPLOAD_DIR = path.join(os.tmpdir(), "smm-uploads");

interface AgentInfo {
    name: string;
    email: string;
    phone: string;
    photo?: string;
}

/**
 * Downloads a remote image and returns its buffer. Falls back to generating a solid color buffer on error.
 */
async function getBufferFromUrl(url: string, defaultColor = { r: 180, g: 180, b: 180, alpha: 1 }): Promise<Buffer> {
    try {
        const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
        if (!res.ok) throw new Error(`Fetch failed: STATUS ${res.status}`);
        const arrayBuffer = await res.arrayBuffer();
        return Buffer.from(arrayBuffer);
    } catch (error: any) {
        console.error(`[image-composer] Error downloading image from url: ${url}. Error: ${error.message}`);
        // Return a default empty image buffer to prevent complete crash
        return sharp({
            create: {
                width: 300,
                height: 300,
                channels: 4,
                background: defaultColor
            }
        })
            .png()
            .toBuffer();
    }
}

/**
 * Superimposes an agent details contact card on the bottom right corner of an image or video thumbnail.
 * Returns the local URL representing the composed file.
 */
export async function composeAgentInfoOverlay(
    mainImageUrl: string,
    agent: AgentInfo | null | undefined,
    baseUrl: string
): Promise<string> {
    if (!agent || !mainImageUrl) {
        return mainImageUrl;
    }

    try {
        // 1. Get buffers for both images
        const mainBuffer = await getBufferFromUrl(mainImageUrl);

        // If agent photo is missing or fails, we use a placeholder or fallback
        const agentPhotoUrl = agent.photo || "https://mhestate.es/assets/img/client-placeholder.jpg";
        const agentAvatarBuffer = await getBufferFromUrl(agentPhotoUrl, { r: 176, g: 141, b: 109, alpha: 1 });

        // 2. Read dimensions of main image using sharp metadata
        const mainMetadata = await sharp(mainBuffer).metadata();
        const width = mainMetadata.width || 800;
        const height = mainMetadata.height || 600;

        // 3. Make circular avatar
        const circleMask = Buffer.from(
            `<svg width="100" height="100"><circle cx="50" cy="50" r="50" fill="white" /></svg>`
        );
        const agentCircle = await sharp(agentAvatarBuffer)
            .resize(100, 100)
            .composite([{ input: circleMask, blend: "dest-in" }])
            .png()
            .toBuffer();

        // 4. White card bg
        const cardBg = await sharp({
            create: {
                width: 236,
                height: 164,
                channels: 4,
                background: { r: 255, g: 255, b: 255, alpha: 0.95 }
            }
        })
            .png()
            .toBuffer();

        // 5. SVG text card styling
        const textSvg = Buffer.from(`
      <svg width="236" height="164">
        <text x="118" y="108" font-family="'Helvetica Neue', Helvetica, Arial, sans-serif" font-size="14" font-weight="bold" fill="#111111" text-anchor="middle">${agent.name.toUpperCase()}</text>
        <text x="118" y="126" font-family="'Helvetica Neue', Helvetica, Arial, sans-serif" font-size="10" fill="#555555" text-anchor="middle">${agent.email}</text>
        <text x="118" y="142" font-family="'Helvetica Neue', Helvetica, Arial, sans-serif" font-size="10" fill="#222222" font-weight="bold" text-anchor="middle">${agent.phone}</text>
      </svg>
    `);

        // 6. Brown card circle border
        const borderSvg = Buffer.from(`
      <svg width="104" height="104">
        <circle cx="52" cy="52" r="50" stroke="#b08d6d" stroke-width="3" fill="none" />
      </svg>
    `);

        const agentCard = await sharp(cardBg)
            .composite([
                { input: agentCircle, top: 12, left: 68 },
                { input: borderSvg, top: 10, left: 66 },
                { input: textSvg, top: 0, left: 0 }
            ])
            .png()
            .toBuffer();

        // 7. Calculate position: Bottom-Right with 20px padding
        const cardWidth = 236;
        const cardHeight = 164;
        const cardLeft = Math.max(0, width - cardWidth - 20);
        const cardTop = Math.max(0, height - cardHeight - 20);

        // 8. Composite
        const finalImageBuffer = await sharp(mainBuffer)
            .composite([
                { input: agentCard, top: cardTop, left: cardLeft }
            ])
            .jpeg({ quality: 90 })
            .toBuffer();

        // 9. Write to local smm-uploads directory
        await fs.promises.mkdir(UPLOAD_DIR, { recursive: true });
        const filename = `composed-${randomUUID()}.jpg`;
        const filepath = path.join(UPLOAD_DIR, filename);
        await fs.promises.writeFile(filepath, finalImageBuffer);

        // Retourne la URL del endpoint media
        return `/api/media/${filename}`;
    } catch (error: any) {
        console.error("[image-composer] Error combining agent info overlay:", error.message);
        return mainImageUrl; // Fallback to raw image on critical error
    }
}
