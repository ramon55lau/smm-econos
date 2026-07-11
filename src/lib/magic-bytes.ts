/**
 * Light check of file headers (Magic Bytes / Magic Numbers)
 * to confirm file types without relying on client-provided MIME types or extensions.
 */

export interface DetectedType {
    mime: string;
    ext: string;
}

export function detectFileTypeFromBuffer(buffer: Buffer): DetectedType | null {
    if (buffer.length < 12) return null;

    // Read first bytes as hex string
    const getHex = (start: number, end: number) =>
        Array.from(buffer.subarray(start, end))
            .map(b => b.toString(16).padStart(2, "0").toUpperCase())
            .join(" ");

    const headerHex4 = getHex(0, 4);
    const headerHex8 = getHex(0, 8);
    const offset4Hex4 = getHex(4, 8); // Bytes 4-7 (useful for ftyp in MP4/MOV)

    // 1. JPEG: FF D8 FF
    if (headerHex4.startsWith("FF D8 FF")) {
        return { mime: "image/jpeg", ext: "jpg" };
    }

    // 2. PNG: 89 50 4E 47 0D 0A 1A 0A
    if (headerHex8.startsWith("89 50 4E 47")) {
        return { mime: "image/png", ext: "png" };
    }

    // 3. GIF: 47 49 46 38 -> "GIF8"
    if (headerHex4 === "47 49 46 38") {
        return { mime: "image/gif", ext: "gif" };
    }

    // 4. WEBP: RIFF (52 49 46 46) at start, WEBP (57 45 42 50) at byte 8-11
    const startsWithRiff = headerHex4 === "52 49 46 46";
    const hasWebpTag = getHex(8, 12) === "57 45 42 50";
    if (startsWithRiff && hasWebpTag) {
        return { mime: "image/webp", ext: "webp" };
    }

    // 5. WEBM: 1A 45 DF A3 (EBML Header)
    if (headerHex4 === "1A 45 DF A3") {
        return { mime: "video/webm", ext: "webm" };
    }

    // 6. MP4/MOV: Look for "ftyp" (66 74 79 70) in bytes 4-7
    // "ftyp" is the box type header indicating ISO base media file format.
    if (offset4Hex4 === "66 74 79 70") {
        // Determine specific layout (could be mov, mp4, etc.)
        const majorBrand = buffer.subarray(8, 12).toString("ascii").trim();
        if (majorBrand === "qt") {
            return { mime: "video/quicktime", ext: "mov" };
        }
        return { mime: "video/mp4", ext: "mp4" };
    }

    return null;
}
