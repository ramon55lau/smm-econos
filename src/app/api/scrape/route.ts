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
  const videoUrl = getXmlTag(block, "video") || getXmlTag(block, "url_video") || getXmlTag(block, "embed");
  if (videoUrl && videoUrl.startsWith("http")) {
    videos.push({ url: videoUrl, thumbnail: images[0], type: "unknown" });
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

  // Detect and extract video
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

  const description = (getMeta(["og:description", "twitter:description", "description"]) || getJsonLdField(["description"]) || "")
    .replace(/&#x27;/g, "'").replace(/&quot;/g, '"');

  const images: string[] = [];

  const ogImg = getMeta(["og:image", "og:image:secure_url", "twitter:image", "image"]) || (jsonLdData.image ? (typeof jsonLdData.image === 'string' ? jsonLdData.image : (jsonLdData.image.url || jsonLdData.image[0])) : null);
  if (ogImg && typeof ogImg === 'string' && ogImg.startsWith("http") && !isJunk(ogImg)) images.push(ogImg);

  // Only grab absolute .jpg / .jpeg / .png URLs
  const directRegex = /https?:\/\/[^\s"'<>\\]+\.(?:jpg|jpeg|png)(?:\?[^\s"'<>\\]*)?/gi;
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
    let match;
    while ((match = directRegex.exec(scriptContent)) !== null && images.length < 60) {
      const src = match[0];
      if (!isJunk(src) && !images.includes(src)) images.push(src);
    }
  }

  // Generic videos from OG tags
  const videos = videoData ? [videoData] : [];
  const ogVid = getMeta(["og:video", "og:video:url", "og:video:secure_url"]);
  if (ogVid && ogVid.startsWith("http") && !videos.some(v => v.url === ogVid)) {
    videos.push({ url: ogVid, type: "unknown", thumbnail: ogImg || undefined });
  }

  // Relative <img src> with .jpg/.png only
  const imgTagRegex = /<img[^>]+(?:src|data-src|data-original)=["']([^"']+\.(?:jpg|jpeg|png)(?:\?[^"']*)?)["'][^>]*>/gi;
  while ((m = imgTagRegex.exec(html)) !== null && images.length < 60) {
    let src = m[1];
    if (src.startsWith("//")) src = "https:" + src;
    else if (src.startsWith("/")) { try { src = new URL(src, url).href; } catch (_) { } }
    if (src.startsWith("http") && !isJunk(src) && !images.includes(src)) images.push(src);
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

  return {
    title: title.substring(0, 100),
    description: (inferredDesc + description).substring(0, 500),
    price: priceTag,
    city: cityTag,
    images,
    videos,
    hashtags,
    suggestedComment: "📍 Consulta detalles y agenda tu visita. ¡Te asesoramos sin compromiso!",
    linkUrl: url,
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

    // Detector específico: mhestate.es (admite propiedad.php?id=X, /es/propiedad?id=X, y urls tipo compra/inmueble-ID)
    const mhMatch = url.match(/mhestate\.es\/.*(?:id=|\-)(\d+)/i);
    if (mhMatch) {
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
