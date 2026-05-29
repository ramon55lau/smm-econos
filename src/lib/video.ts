/**
 * Video Extraction Utility
 * Extracts direct video URLs or metadata from social media and generic links
 */

export interface ExtractedVideo {
    url: string;
    type: "video/mp4" | "video/webm" | "video/ogg" | "unknown";
    quality?: string;
    thumbnail?: string;
}

/**
 * Main function to extract video information from a URL
 */
export async function extractVideoFromUrl(url: string): Promise<ExtractedVideo | null> {
    if (!url) return null;

    try {
        // 1. YouTube detection
        if (url.includes("youtube.com") || url.includes("youtu.be")) {
            return await extractYouTubeVideo(url);
        }

        // 2. Facebook detection
        if (url.includes("facebook.com")) {
            return await extractFacebookVideo(url);
        }

        // 3. Instagram detection
        if (url.includes("instagram.com")) {
            return await extractInstagramVideo(url);
        }

        // 4. Pixabay detection
        if (url.includes("pixabay.com")) {
            return await extractPixabayVideo(url);
        }

        // 5. Generic Web Page
        return await extractGenericVideo(url);
    } catch (error) {
        console.error(`[Video Extraction] Error extracting from ${url}:`, error);
        return null;
    }
}

/**
 * Pixabay Extraction
 * Pixabay uses client-side rendering, but we can catch the video URL in certain HTML attributes
 */
async function extractPixabayVideo(url: string): Promise<ExtractedVideo | null> {
    const res = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36" }
    });
    if (!res.ok) return null;
    const html = await res.text();

    // Look for file-url or direct CDN links
    const fileUrlMatch = html.match(/file-url=([^"&'\s]+)/) || html.match(/"file_url":"([^"]+)"/);
    if (fileUrlMatch) {
        let videoUrl = decodeURIComponent(fileUrlMatch[1]).replace(/\\/g, "");
        if (videoUrl.startsWith("//")) videoUrl = `https:${videoUrl}`;
        else if (!videoUrl.startsWith("http")) videoUrl = `https://cdn.pixabay.com${videoUrl}`;

        return {
            url: videoUrl,
            type: "video/mp4",
            thumbnail: html.match(/"thumbnailUrl":"([^"]+)"/)?.[1]
        };
    }

    const cdnMatch = html.match(/(https:\/\/cdn\.pixabay\.com\/video\/[^\s"'<>]+)/);
    if (cdnMatch) {
        return {
            url: cdnMatch[1],
            type: "video/mp4",
            thumbnail: html.match(/"thumbnailUrl":"([^"]+)"/)?.[1]
        };
    }

    return extractGenericVideo(url, html);
}

/**
 * YouTube Extraction
 * NOTE: For a production app, using a library like 'ytdl-core' or an external API is recommended.
 * Here we'll try to find metadata first.
 */
async function extractYouTubeVideo(url: string): Promise<ExtractedVideo | null> {
    // Extract Video ID
    let videoId = "";
    if (url.includes("v=")) {
        videoId = url.split("v=")[1].split("&")[0];
    } else if (url.includes("youtu.be/")) {
        videoId = url.split("youtu.be/")[1].split("?")[0];
    }

    if (!videoId) return null;

    return {
        url: `https://www.youtube.com/watch?v=${videoId}`, // We return the link, the actual download will happen in the publisher
        type: "unknown",
        thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
    };
}

/**
 * Facebook Extraction (Scraping fallback)
 */
async function extractFacebookVideo(url: string): Promise<ExtractedVideo | null> {
    const res = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36" }
    });
    const html = await res.text();

    // Look for direct video URLs in script tags or meta tags
    const ogVideoMatch = html.match(/"browser_native_sd_url":"([^"]+)"/) ||
        html.match(/"browser_native_hd_url":"([^"]+)"/) ||
        html.match(/<meta property="og:video" content="([^"]+)"/);

    const ogThumbMatch = html.match(/<meta property="og:image" content="([^"]+)"/);

    if (ogVideoMatch) {
        let videoUrl = ogVideoMatch[1].replace(/\\/g, "").replace(/&amp;/g, "&");
        return {
            url: videoUrl,
            type: "video/mp4",
            thumbnail: ogThumbMatch ? ogThumbMatch[1].replace(/&amp;/g, "&") : undefined
        };
    }

    return null;
}

/**
 * Instagram Extraction (Scraping fallback)
 */
async function extractInstagramVideo(url: string): Promise<ExtractedVideo | null> {
    const res = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36" }
    });
    const html = await res.text();

    // Instagram often hides the video URL in a complex JSON structure
    const videoMatch = html.match(/"video_url":"([^"]+)"/) ||
        html.match(/<meta property="og:video" content="([^"]+)"/);

    const ogThumbMatch = html.match(/<meta property="og:image" content="([^"]+)"/);

    if (videoMatch) {
        let videoUrl = videoMatch[1].replace(/\\/g, "").replace(/&amp;/g, "&");
        return {
            url: videoUrl,
            type: "video/mp4",
            thumbnail: ogThumbMatch ? ogThumbMatch[1].replace(/&amp;/g, "&") : undefined
        };
    }

    return null;
}

/**
 * Generic Web Page Extraction (Open Graph + HTML5 Video)
 */
async function extractGenericVideo(url: string, providedHtml?: string): Promise<ExtractedVideo | null> {
    let html = providedHtml;
    if (!html) {
        const res = await fetch(url, {
            headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36" }
        });
        if (!res.ok) return null;
        html = await res.text();
    }

    // 1. OG Video / Twitter Stream
    const ogVideoMatch = html.match(/property="og:video" content="([^"]+)"/) ||
        html.match(/name="twitter:player:stream" content="([^"]+)"/);
    if (ogVideoMatch) {
        return {
            url: ogVideoMatch[1].replace(/&amp;/g, "&"),
            type: "unknown",
            thumbnail: html.match(/property="og:image" content="([^"]+)"/)?.[1]
        };
    }

    // 2. Direct MP4 links in the source
    const directMatch = html.match(/(https?:\/\/[^\s"'<>]+\.(?:mp4|webm|mov|ogg|m4v)(?:\?[^\s"'<>]*)?)/i);
    if (directMatch && !directMatch[1].includes("googlevideo.com")) { // Avoid some false positives
        return {
            url: directMatch[1],
            type: "unknown",
            thumbnail: html.match(/property="og:image" content="([^"]+)"/)?.[1]
        };
    }

    // 3. HTML5 Video Tag
    const videoSrcMatch = html.match(/<video[^>]*>\s*<source[^>]+src="([^"]+)"/) ||
        html.match(/<video[^>]+src="([^"]+)"/);
    if (videoSrcMatch) {
        let videoUrl = videoSrcMatch[1];
        if (videoUrl.startsWith("//")) videoUrl = "https:" + videoUrl;
        else if (videoUrl.startsWith("/")) {
            try {
                const urlObj = new URL(url);
                videoUrl = `${urlObj.origin}${videoUrl}`;
            } catch (_) { }
        }
        return { url: videoUrl, type: "unknown" };
    }

    return null;
}
