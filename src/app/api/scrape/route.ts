import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { extractVideoFromUrl } from "@/lib/video";

const JUNK_KEYWORDS = ["logo", "icon", "avatar", "placeholder", "spinner", "blank", "badge", "flag", "sprite"];

function isJunk(src: string): boolean {
  const lower = src.toLowerCase();
  return JUNK_KEYWORDS.some(k => lower.includes(k));
}

function cleanTitle(title: string): string {
  let t = title.replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&").trim();
  if (t.includes("|")) t = t.split("|")[0].trim();
  return t;
}

function cleanHtmlEntities(text: string): string {
  return text
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&aring;/g, "å")
    .replace(/&Aring;/g, "Å")
    .replace(/&auml;/g, "ä")
    .replace(/&Auml;/g, "Ä")
    .replace(/&ouml;/g, "ö")
    .replace(/&Ouml;/g, "Ö")
    .replace(/&eacute;/g, "é")
    .replace(/&Eacute;/g, "É")
    .replace(/&#228;/g, "ä")
    .replace(/&#229;/g, "å")
    .replace(/&#246;/g, "ö")
    .replace(/&#196;/g, "Ä")
    .replace(/&#197;/g, "Å")
    .replace(/&#214;/g, "Ö");
}

function generateHashtags(parts: string[]): string[] {
  const words: string[] = [];
  for (const part of parts) {
    const split = part
      .replace(/[^\w\sáéíóúñÁÉÍÓÚÑ\-]/gi, "")
      .split(/[\s\-–—]+/)
      .map(w => w.trim())
      .filter(w => w.length > 2);
    words.push(...split);
  }
  const unique = [...new Set(words)];
  return unique.map(w => `#${w.charAt(0).toUpperCase() + w.slice(1)}`);
}

// Extract content from XML tag (handles CDATA and plain values)
function getXmlTag(xml: string, tag: string): string {
  // Try CDATA format first
  const cdataRe = new RegExp(`<${tag}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*</${tag}>`, "i");
  const cdataM = xml.match(cdataRe);
  if (cdataM) return cdataM[1].trim();

  // Try plain format
  const plainRe = new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, "i");
  const plainM = xml.match(plainRe);
  return plainM ? plainM[1].trim() : "";
}

// ─── MH Estate specific handler ──────────────────────────────────────────────
async function scrapeMHEstate(propertyId: string, originalUrl: string) {
  const xmlUrl = "https://mhestate.es/assets/data/propiedades.xml";
  const xmlRes = await fetch(xmlUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "Accept": "application/xml, text/xml, */*",
    },
    // No cache so we always get fresh data
    cache: "no-store",
  });

  if (!xmlRes.ok) throw new Error(`XML fetch failed: ${xmlRes.status}`);
  const xml = await xmlRes.text();

  // Locate the property block by <id> tag (exact match)
  // Search for <id>27603199</id> pattern
  const idSearch = `<id>${propertyId}</id>`;
  const idIdx = xml.indexOf(idSearch);
  if (idIdx === -1) {
    // Try referencia tag as fallback
    const refSearch = `<referencia>${propertyId}</referencia>`;
    const refIdx = xml.indexOf(refSearch);
    if (refIdx === -1) throw new Error(`Property ${propertyId} not found in XML`);
  }

  const blockStart = xml.lastIndexOf("<propiedad", idIdx === -1
    ? xml.indexOf(`<referencia>${propertyId}</referencia>`)
    : idIdx);
  const blockEnd = xml.indexOf("</propiedad>", blockStart) + "</propiedad>".length;
  const block = xml.substring(blockStart, blockEnd);

  if (!block || block.length < 10) throw new Error("Could not extract property block");

  // Extract fields using exact tag names confirmed from XML inspection
  const tipoOfer = getXmlTag(block, "tipo_ofer") || getXmlTag(block, "tipo_inmueble") || "Propiedad";
  const zona = getXmlTag(block, "zona") || "";
  const ciudad = getXmlTag(block, "ciudad") || "";
  const titulo1 = getXmlTag(block, "titulo1") || "";

  // Build a clean display title: ALWAYS tipo_ofer - zona (the user wants this format)
  const displayTitle = (tipoOfer && zona)
    ? `${tipoOfer} - ${zona}`
    : (tipoOfer || zona || titulo1 || "Propiedad");

  const descrip = getXmlTag(block, "descrip1") || getXmlTag(block, "descripcion") || "";
  const numfotos = parseInt(getXmlTag(block, "numfotos") || "0", 10) || 15;
  const rawPrice = getXmlTag(block, "precioinmo") || getXmlTag(block, "precioalq") || getXmlTag(block, "precio") || getXmlTag(block, "precio_venta") || "";
  const price = rawPrice.replace(/[^0-9.]/g, ""); // Extrae solo los numeros

  // Clean and truncate description: first meaningful paragraph only (~280 chars)
  let cleanDescrip = descrip.replace(/\s+/g, " ").replace(/~~/g, " ").trim();
  // Truncate at ~280 chars, ending at last full sentence (period or comma)
  if (cleanDescrip.length > 280) {
    const cut = cleanDescrip.substring(0, 280);
    const lastPeriod = Math.max(cut.lastIndexOf("."), cut.lastIndexOf("!"), cut.lastIndexOf("?"));
    const lastComma = cut.lastIndexOf(",");
    const breakPoint = lastPeriod > 150 ? lastPeriod + 1 : (lastComma > 150 ? lastComma : 280);
    cleanDescrip = cut.substring(0, breakPoint).trim();
  }
  const images: string[] = [];
  for (let i = 1; i <= Math.min(numfotos, 20); i++) {
    const fotoUrl = getXmlTag(block, `foto${i}`);
    if (fotoUrl && fotoUrl.startsWith("http") && !isJunk(fotoUrl)) {
      images.push(fotoUrl);
    } else if (!fotoUrl) {
      break;
    }
  }

  const videos: { url: string; thumbnail?: string; type?: string }[] = [];

  // Check common video tag names (including the <videos><video1> structure used by MHEstate XML)
  const videoTagNames = ["video", "url_video", "embed", "video1", "video2", "video3"];
  for (const tagName of videoTagNames) {
    const vUrl = getXmlTag(block, tagName);
    if (vUrl && vUrl.startsWith("http") && !videos.some(v => v.url === vUrl)) {
      // Generate YouTube thumbnail if applicable
      let thumb: string | undefined = images[0];
      const lowerVUrl = vUrl.toLowerCase();
      if (lowerVUrl.includes("youtube.com") || lowerVUrl.includes("youtu.be")) {
        let videoId = "";
        if (vUrl.includes("v=")) {
          videoId = vUrl.split("v=")[1].split("&")[0];
        } else if (vUrl.includes("youtu.be/")) {
          videoId = vUrl.split("youtu.be/")[1].split("?")[0];
        } else if (vUrl.includes("embed/")) {
          videoId = vUrl.split("embed/")[1].split("?")[0];
        }
        if (videoId) thumb = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
      }
      videos.push({ url: vUrl, thumbnail: thumb, type: "unknown" });
    }
  }

  // Build hashtags from tipo_ofer + zona + ciudad
  const hashtagParts = [tipoOfer, zona, ciudad].filter(Boolean);
  const hashtags = generateHashtags(hashtagParts);

  return {
    title: cleanTitle(displayTitle).substring(0, 100),
    description: cleanDescrip,
    price,
    city: ciudad,
    images,
    videos,
    hashtags,
    suggestedComment: "📍 Consulta detalles y agenda tu visita. ¡Te asesoramos sin compromiso!",
    linkUrl: originalUrl,
  };
}

function inferFromUrl(url: string): { title: string; city?: string; ref?: string } {
  try {
    const u = new URL(url);
    const parts = u.pathname.split('/').filter(p => p && p !== 'es' && p !== 'en' && p !== 'compra' && p !== 'alquiler' && p !== 'undefined');

    let domainName = u.hostname.replace('www.', '').split('.')[0];
    domainName = domainName.charAt(0).toUpperCase() + domainName.slice(1);

    if (parts.length > 0) {
      const textParts = parts.filter(p => isNaN(Number(p)));
      const numParts = parts.filter(p => !isNaN(Number(p)) && p.length > 3);

      const city = textParts.length > 1 ? textParts[textParts.length - 1] : textParts[0];
      const type = parts[0];
      const ref = numParts.length > 0 ? numParts[numParts.length - 1] : undefined;

      const cleanCity = city.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      const cleanType = type.charAt(0).toUpperCase() + type.slice(1);

      return {
        title: `${cleanType} en ${cleanCity} - ${domainName}`,
        city: cleanCity,
        ref: ref
      };
    }

    return { title: `Inmueble en ${domainName}` };
  } catch (e) {
    return { title: "Enlace externo" };
  }
}

// ─── Recursive helper to locate media inside arbitrary structures ──────────
function findMediaRecursively(obj: any, urlContext: string, extractedImages: string[], extractedVideos: any[]) {
  if (!obj) return;
  if (typeof obj === 'string') {
    const isUrl = obj.startsWith('http://') || obj.startsWith('https://');
    if (isUrl) {
      const lower = obj.toLowerCase();
      // Check for video links
      if (
        lower.includes("youtube.com") ||
        lower.includes("youtu.be") ||
        lower.includes("vimeo.com") ||
        lower.endsWith(".mp4") ||
        lower.endsWith(".webm") ||
        lower.endsWith(".mov") ||
        lower.endsWith(".ogg") ||
        lower.endsWith(".m4v") ||
        lower.includes("/video/")
      ) {
        if (!extractedVideos.some(v => v.url === obj)) {
          let thumb = undefined;
          if (lower.includes("youtube.com") || lower.includes("youtu.be")) {
            let videoId = "";
            if (obj.includes("v=")) {
              videoId = obj.split("v=")[1].split("&")[0];
            } else if (obj.includes("youtu.be/")) {
              videoId = obj.split("youtu.be/")[1].split("?")[0];
            }
            if (videoId) thumb = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
          }
          extractedVideos.push({ url: obj, type: "unknown", thumbnail: thumb });
        }
      }
      // Check for image links
      else if (
        lower.endsWith(".jpg") ||
        lower.endsWith(".jpeg") ||
        lower.endsWith(".png") ||
        lower.endsWith(".webp") ||
        lower.endsWith(".avif") ||
        lower.includes(".jpg?") ||
        lower.includes(".jpeg?") ||
        lower.includes(".png?") ||
        lower.includes(".webp?") ||
        lower.includes(".avif?") ||
        lower.includes("/images/") ||
        lower.includes("/img/") ||
        lower.includes("/photo/") ||
        lower.includes("/photos/") ||
        lower.includes("/picture/") ||
        lower.includes("/pictures/") ||
        lower.includes("/uploads/") ||
        obj.includes("api.maklarringen.se/images/")
      ) {
        if (!isJunk(obj) && !extractedImages.includes(obj)) {
          extractedImages.push(obj);
        }
      }
    }
  } else if (Array.isArray(obj)) {
    for (const item of obj) {
      findMediaRecursively(item, urlContext, extractedImages, extractedVideos);
    }
  } else if (typeof obj === 'object') {
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        findMediaRecursively(obj[key], urlContext, extractedImages, extractedVideos);
      }
    }
  }
}

// ─── Generic scraper ─────────────────────────────────────────────────────────
async function scrapeGeneric(url: string) {
  let html = "";
  let isBlocked = false;
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
        "Referer": "https://www.google.com/",
        "Cache-Control": "no-cache",
      },
      cache: "no-store",
    });

    if (response.status === 403) isBlocked = true;
    html = await response.text();
  } catch (err) {
    console.warn(`Scrape generic warning for ${url}:`, err);
  }

  // Detect and extract video directly from URL context
  const videoData = await extractVideoFromUrl(url);

  // If no html or catastrophically failed, return base hybridized object
  if (!html || html.trim() === "" || isBlocked) {
    return {
      title: isBlocked ? "⚠️ Acceso Bloqueado por el Sitio" : "Enlace externo",
      description: isBlocked
        ? "El sitio web destino (como Idealista) ha bloqueado la extracción automática. Por favor, copia y pega los detalles manualmente."
        : "No se pudo obtener información detallada de este enlace. Puedes editar este texto manualmente.",
      images: [],
      videos: videoData ? [videoData] : [],
      hashtags: [],
      suggestedComment: "📍 Consulta detalles y agenda tu visita. ¡Te asesoramos sin compromiso!",
      linkUrl: url,
    };
  }

  const getMeta = (names: string[]) => {
    for (const name of names) {
      const r1 = html.match(new RegExp(`<meta[^>]+(?:name|property|itemprop)=["']${name}["'][^>]*content=["']([^"']+)["']`, "i"));
      if (r1) return r1[1];
      const r2 = html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]*(?:name|property|itemprop)=["']${name}["']`, "i"));
      if (r2) return r2[1];
    }
    return null;
  };

  // --- Deep Extraction: JSON-LD ---
  let jsonLdData: any = {};
  const jsonLdMatches = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  if (jsonLdMatches) {
    for (const match of jsonLdMatches) {
      try {
        const content = match.replace(/<script[^>]*>|<\/script>/gi, '').trim();
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          parsed.forEach(item => { if (item["@type"] === "Product" || item["@type"] === "RealEstateListing") jsonLdData = { ...jsonLdData, ...item }; });
        } else {
          jsonLdData = { ...jsonLdData, ...parsed };
        }
      } catch (e) { }
    }
  }

  const getJsonLdField = (fields: string[]) => {
    for (const f of fields) {
      if (jsonLdData[f]) return jsonLdData[f];
    }
    return null;
  };

  let title = getMeta(["og:title", "twitter:title", "title"]) || getJsonLdField(["name", "headline"]) || "";
  if (!title) {
    const tm = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const h1m = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    title = tm ? tm[1] : (h1m ? h1m[1].replace(/<[^>]*>/g, '').trim() : "");
  }
  title = cleanTitle(title);

  let description = cleanHtmlEntities(getMeta(["og:description", "twitter:description", "description"]) || getJsonLdField(["description"]) || "");

  // Fallback heuristic: Try parsing paragraphs from body text if description is missing or too short
  if (!description || description.trim().length < 25) {
    const pMatches = html.match(/<p[^>]*>([\s\S]*?)<\/p>/gi);
    if (pMatches) {
      const candidates = pMatches
        .map(p => p.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim())
        .filter(text => {
          if (text.length < 45) return false;
          const lower = text.toLowerCase();
          if (
            lower.includes("javascript") ||
            lower.includes("cookie") ||
            lower.includes("privacy") ||
            lower.includes("integritetspolicy") ||
            lower.includes("användarvillkor") ||
            lower.includes("copyright") ||
            lower.includes("derechos reservados") ||
            lower.includes("lorem ipsum")
          ) return false;
          return true;
        });

      if (candidates.length > 0) {
        description = cleanHtmlEntities(candidates.slice(0, 3).join("\n\n"));
      }
    }
  }

  const images: string[] = [];
  const videos: { url: string; type?: string; thumbnail?: string }[] = [];

  // Add the primary URL inferred video (e.g. youtube/vimeo link) first so it gets prioritized
  if (videoData) {
    if (!videos.some(v => v.url === videoData.url)) {
      videos.push(videoData);
    }
  }

  // Extract from Next.js hydration stores if present (__NEXT_DATA__)
  const nextDataMatch = html.match(/<script[^>]+id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/i);
  if (nextDataMatch) {
    try {
      const nextDataObj = JSON.parse(nextDataMatch[1].trim());
      findMediaRecursively(nextDataObj, url, images, videos);
    } catch (e) {
      console.warn("Failed to parse __NEXT_DATA__ state:", e);
    }
  }

  // Also apply it to parsed JSON-LD
  if (jsonLdData && Object.keys(jsonLdData).length > 0) {
    findMediaRecursively(jsonLdData, url, images, videos);
  }

  const ogImg = getMeta(["og:image", "og:image:secure_url", "twitter:image", "image"]) || (jsonLdData.image ? (typeof jsonLdData.image === 'string' ? jsonLdData.image : (jsonLdData.image.url || jsonLdData.image[0])) : null);
  if (ogImg && typeof ogImg === 'string' && ogImg.startsWith("http") && !isJunk(ogImg)) {
    if (!images.includes(ogImg)) {
      images.push(ogImg);
    }
  }

  // Only grab absolute .jpg / .jpeg / .png / .webp / .avif URLs
  const directRegex = /https?:\/\/[^\s"'<>\\]+\.(?:jpg|jpeg|png|webp|avif)(?:\?[^\s"'<>\\]*)?/gi;
  let m: RegExpExecArray | null;
  while ((m = directRegex.exec(html)) !== null && images.length < 50) {
    const src = m[0];
    if (!isJunk(src) && !images.includes(src)) images.push(src);
  }

  // Scavenge scripts for image URLs (for modern SPA sites)
  const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
  let sm: RegExpExecArray | null;
  while ((sm = scriptRegex.exec(html)) !== null && images.length < 60) {
    const scriptContent = sm[1];

    // Scan direct regex
    let match;
    while ((match = directRegex.exec(scriptContent)) !== null && images.length < 60) {
      const src = match[0];
      if (!isJunk(src) && !images.includes(src)) images.push(src);
    }

    // Try to parse JSON variables inside script
    const jsonMatches = scriptContent.match(/({[\s\S]*?}|\[[\s\S]*?\])/g);
    if (jsonMatches) {
      for (const jsonStr of jsonMatches) {
        if (jsonStr.length > 50 && (jsonStr.includes("http") || jsonStr.includes("/images/"))) {
          try {
            const parsedObj = JSON.parse(jsonStr);
            findMediaRecursively(parsedObj, url, images, videos);
          } catch (_) { }
        }
      }
    }
  }

  // Generic videos from OG tags
  const ogVid = getMeta(["og:video", "og:video:url", "og:video:secure_url"]);
  if (ogVid && ogVid.startsWith("http") && !videos.some(v => v.url === ogVid)) {
    videos.push({ url: ogVid, type: "unknown", thumbnail: ogImg || undefined });
  }

  // Relative <img src>
  const imgTagRegex = /<img[^>]+(?:src|data-src|data-original)=["']([^"']+\.(?:jpg|jpeg|png|webp|avif)(?:\?[^"']*)?)["'][^>]*>/gi;
  while ((m = imgTagRegex.exec(html)) !== null && images.length < 60) {
    let src = m[1];
    if (src.startsWith("//")) src = "https:" + src;
    else if (src.startsWith("/")) { try { src = new URL(src, url).href; } catch (_) { } }
    if (src.startsWith("http") && !isJunk(src) && !images.includes(src)) images.push(src);
  }

  // Custom regexes for common CDN media patterns that might not end with extensions (like api.maklarringen.se/images/)
  const cdnPatterns = [
    /https?:\/\/[^\s"'<>\\]+?\/images\/[^\s"'<>\\]+/gi,
    /https?:\/\/[^\s"'<>\\]+?\/photos\/[^\s"'<>\\]+/gi,
    /https?:\/\/[^\s"'<>\\]+?\/uploads\/[^\s"'<>\\]+/gi
  ];
  for (const regex of cdnPatterns) {
    let match;
    while ((match = regex.exec(html)) !== null && images.length < 70) {
      const src = match[0].split(/[\\"']/)[0]; // strip quotes if any
      if (src.startsWith("http") && !isJunk(src) && !images.includes(src)) {
        images.push(src);
      }
    }
  }

  const hashtags = generateHashtags([title]);

  let priceTag = getMeta(["product:price:amount"]) || "";
  let cityTag = getMeta(["og:locality", "place:location:locality"]) || "";
  let inferredDesc = "";

  // --- Last Resort: URL Inference if metadata is very sparse ---
  if ((!title || title === "Public Store" || title === "Enlace externo") && images.length === 0) {
    const inferred = inferFromUrl(url);
    if (!title || title === "Public Store" || title === "Enlace externo") title = inferred.title;
    if (!cityTag) cityTag = inferred.city || "";
    if (inferred.ref) inferredDesc = `Referencia del inmueble: ${inferred.ref}. `;
  }

  // If there are videos, let's make sure the thumbnail of the video is first in images or video is clearly marked
  // We prioritize video: if a video exists, ensure its structure is clear in the response payload
  if (videos.length > 0) {
    // If the video has a thumbnail, put it at the beginning of images (or make sure we have a good picture)
    for (const v of videos) {
      if (v.thumbnail && !images.includes(v.thumbnail)) {
        images.unshift(v.thumbnail);
      }
    }
  }

  return {
    title: title.substring(0, 100),
    description: (inferredDesc + description).substring(0, 500),
    price: priceTag,
    city: cityTag,
    images: images.slice(0, 50),
    videos: videos,
    hashtags,
    suggestedComment: "📍 Consulta detalles y agenda tu visita. ¡Te asesoramos sin compromiso!",
    linkUrl: url,
  };
} async function scrapeYouTube(url: string) {
  let videoId = "";
  if (url.includes("v=")) {
    videoId = url.split("v=")[1].split("&")[0];
  } else if (url.includes("youtu.be/")) {
    videoId = url.split("youtu.be/")[1].split("?")[0];
  } else if (url.includes("/embed/")) {
    videoId = url.split("/embed/")[1].split("?")[0];
  } else if (url.includes("/shorts/")) {
    videoId = url.split("/shorts/")[1].split("?")[0];
  }

  if (!videoId) return await scrapeGeneric(url);

  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;

  let html = "";
  try {
    const res = await fetch(watchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "es-ES,es;q=0.9,en;q=0.8"
      }
    });
    if (res.ok) {
      html = await res.text();
    }
  } catch (err) {
    console.error("Fetcher error for YouTube:", err);
  }

  let title = "";
  let description = "";
  let keywords: string[] = [];
  let duration = 0;

  // 1. Try parsing ytInitialPlayerResponse
  if (html) {
    const match = html.match(/ytInitialPlayerResponse\s*=\s*({[\s\S]*?});/);
    if (match) {
      try {
        const playerResponse = JSON.parse(match[1]);
        const details = playerResponse.videoDetails || {};
        title = details.title || "";
        description = details.shortDescription || "";
        keywords = details.keywords || [];
        duration = parseInt(details.lengthSeconds || "0", 10);
      } catch (e) {
        console.warn("Failed to parse ytInitialPlayerResponse", e);
      }
    }
  }

  // 2. Fallbacks using meta tags in html
  if (!title && html) {
    const tm = html.match(/<meta\s+name="title"\s+content="([^"]+)"/i) || html.match(/<title[^>]*>([^<]+)<\/title>/i);
    title = tm ? tm[1].replace(" - YouTube", "") : "";
  }
  if (!description && html) {
    const dm = html.match(/<meta\s+name="description"\s+content="([^"]+)"/i) || html.match(/property="og:description"\s+content="([^"]+)"/i);
    description = dm ? dm[1] : "";
  }

  // 3. oEmbed backup for title if still missing
  if (!title) {
    try {
      const oembedRes = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(watchUrl)}&format=json`);
      if (oembedRes.ok) {
        const oembed = await oembedRes.json();
        title = oembed.title || "";
      }
    } catch (e) {
      console.warn("YouTube oEmbed failed:", e);
    }
  }

  // Formatting and cleanup
  title = cleanTitle(title || "Video de YouTube");
  description = cleanHtmlEntities(description || "Descripción del video de YouTube");

  // Attempt to extract hashtags from the scraped description
  let hashtags: string[] = [];
  if (description) {
    const descHashtags = description.match(/#\w+/g);
    if (descHashtags) {
      hashtags = [...new Set(descHashtags)];
    }
  }

  if (hashtags.length === 0 && keywords.length > 0) {
    hashtags = keywords.map(kw => `#${kw.replace(/\s+/g, '')}`).slice(0, 10);
  }
  if (hashtags.length === 0) {
    hashtags = generateHashtags([title]);
  }

  const thumb = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

  return {
    title: title.substring(0, 100),
    description: description.substring(0, 500),
    price: "",
    city: "",
    images: [thumb],
    videos: [{ url: watchUrl, thumbnail: thumb, type: "unknown", duration }],
    hashtags,
    suggestedComment: "🎬 ¡Mira este increíble video de YouTube! Déjanos un comentario si te ha gustado.",
    linkUrl: watchUrl
  };
}

// ─── Main Route ───────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { url } = await req.json();
    if (!url || !url.startsWith("http")) {
      return NextResponse.json({ error: "URL inválida" }, { status: 400 });
    }

    let result;

    const isYouTube = url.includes("youtube.com") || url.includes("youtu.be");
    const mhMatch = url.match(/mhestate\.es\/.*(?:id=|\-)(\d+)/i);

    if (isYouTube) {
      result = await scrapeYouTube(url);
    } else if (mhMatch) {
      result = await scrapeMHEstate(mhMatch[1], url);
    } else {
      result = await scrapeGeneric(url);
    }

    return NextResponse.json(result);

  } catch (error: any) {
    console.error("Scrape Error:", error.message);
    return NextResponse.json({ error: `Error: ${error.message}` }, { status: 500 });
  }
}
