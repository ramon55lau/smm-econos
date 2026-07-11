"use client";

import { useState, useEffect, useRef } from "react";
import { ScrapedData, Platform } from "./UnifiedFlow";

type Props = {
    data: ScrapedData;
    platform: Platform;
    onPublish: (updatedData: ScrapedData) => void;
    onBack: () => void;
};

export default function ScreenAdEditor({ data, platform, onPublish, onBack }: Props) {
    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Local state for editing
    const [title, setTitle] = useState(data.title);
    const [description, setDescription] = useState(data.description);
    const [hashtags, setHashtags] = useState(data.hashtags?.join(' ') || "");
    const [isAds, setIsAds] = useState(platform === 'google-ads');

    // Filter out invalid/empty images and videos to prevent empty/broken selection cards
    const sanitizedImages = (data.images || []).filter(img => typeof img === 'string' && img.trim().length > 0 && img.startsWith('http'));
    const sanitizedVideos = (data.videos || []).filter(v => v && typeof v.url === 'string' && v.url.trim().length > 0 && v.url.startsWith('http'));

    useEffect(() => {
        if (platform === 'youtube' || platform === 'instagram' || platform === 'facebook') {
            setIsAds(false);
        }
    }, [platform]);

    // Multi-media selection
    const [selectedMedia, setSelectedMedia] = useState<{ url: string, type: 'image' | 'video' }[]>(
        (sanitizedVideos.length > 0)
            ? [{ url: sanitizedVideos[0].url, type: 'video' }]
            : (sanitizedImages.length > 0) ? [{ url: sanitizedImages[0], type: 'image' }] : []
    );

    const [cta, setCta] = useState("Más información");
    const [destinationUrl, setDestinationUrl] = useState(data.linkUrl);
    const [activeSection, setActiveSection] = useState<string | null>(null);

    const toggleMedia = (url: string, type: 'image' | 'video') => {
        const exists = selectedMedia.find(m => m.url === url);
        if (exists) {
            setSelectedMedia(selectedMedia.filter(m => m.url !== url));
        } else {
            setSelectedMedia([...selectedMedia, { url, type }]);
        }
    };

    // Primary media for preview
    const primaryMedia = selectedMedia[0] || { url: '', type: 'image' };

    const isInstagram = platform.includes("instagram");
    const isFacebook = platform.includes("facebook");
    const isYouTube = platform.includes("youtube");
    const isGoogleAds = platform.includes("google-ads");

    // Define platform-specific variants
    const platformVariants = isFacebook ? [
        { id: 'feed', label: 'Feed / Muro', icon: '🎞️' },
        { id: 'story', label: 'Story', icon: '📱' },
        { id: 'reels', label: 'Reels', icon: '🎬' },
    ] : isInstagram ? [
        { id: 'feed', label: 'Feed', icon: '🖼️' },
        { id: 'story', label: 'Story', icon: '📱' },
        { id: 'reels', label: 'Reels', icon: '🎬' },
    ] : isYouTube ? [
        { id: 'video', label: 'Video Ad', icon: '📺' },
        { id: 'shorts', label: 'Shorts', icon: '📱' },
    ] : [
        { id: 'display', label: 'Display Banner', icon: '🖼️' },
        { id: 'search', label: 'Search Ad', icon: '🔍' },
    ];

    // Local state for variant selection
    const [variant, setVariant] = useState(platformVariants[0].id);

    // Carousel state for preview
    const [carouselIndex, setCarouselIndex] = useState(0);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [extraMedia, setExtraMedia] = useState<{ url: string, type: 'image' | 'video' }[]>([]);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        const newMedia: { url: string, type: 'image' | 'video' }[] = [];
        Array.from(files).forEach(file => {
            const url = URL.createObjectURL(file);
            const type = file.type.startsWith('video') ? 'video' : ('image' as const);
            newMedia.push({ url, type });
        });

        setExtraMedia(prev => [...prev, ...newMedia]);
        setSelectedMedia(prev => [...prev, ...newMedia]);
    };

    useEffect(() => {
        if (carouselIndex >= selectedMedia.length) {
            setCarouselIndex(0);
        }
    }, [selectedMedia, carouselIndex]);

    const nextMedia = () => setCarouselIndex((prev) => (prev + 1) % selectedMedia.length);
    const prevMedia = () => setCarouselIndex((prev) => (prev - 1 + selectedMedia.length) % selectedMedia.length);

    const handleSuggestHashtags = () => {
        const text = `${title} ${description}`.toLowerCase();
        const keywords: string[] = [];

        // Basic keyword extraction
        const commonHashtags = ["smm", "publicidad", "marketing"];
        if (text.includes("venta") || text.includes("vende")) keywords.push("venta");
        if (text.includes("alquiler") || text.includes("renta")) keywords.push("alquiler");
        if (text.includes("casa") || text.includes("hogar")) keywords.push("casa", "home");
        if (text.includes("apto") || text.includes("apartamento")) keywords.push("apartamento", "apt");
        if (text.includes("lujo") || text.includes("luxury")) keywords.push("lujo", "luxury", "exclusive");
        if (text.includes("nuevo") || text.includes("estrenar")) keywords.push("estreno", "newhome");
        if (text.includes("oportunidad") || text.includes("rebajado")) keywords.push("oportunidad", "oferta");

        // Location detection (simple)
        const cityMatch = text.match(/(en|en el|en la)\s+([a-z]+)/);
        if (cityMatch && cityMatch[2]) {
            const city = cityMatch[2].replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
            if (city.length > 3) keywords.push(city);
        }

        const words = text.split(/\s+/).filter(w => w.length > 5).slice(0, 3);
        const autoTags = words.map(w => w.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ""));

        const finalTags = Array.from(new Set([...commonHashtags, ...keywords, ...autoTags]))
            .map(t => `#${t}`)
            .join(' ');

        setHashtags(prev => prev ? `${prev} ${finalTags}` : finalTags);
    };

    const handlePublishLocal = () => {
        onPublish({
            ...data,
            title,
            description,
            hashtags: hashtags.split(' ').filter(t => t.trim() !== ''),
            linkUrl: destinationUrl,
            images: selectedMedia.filter(m => m.type === 'image').map(m => m.url),
            videos: selectedMedia.filter(m => m.type === 'video').map(m => ({ url: m.url })),
        });
    };

    if (!isMounted) return <div className="ad-editor-screen loading-placeholder"></div>;

    return (
        <div className="ad-editor-screen">
            <div className="top-nav">
                <button className="back-btn" onClick={onBack}>← Volver a canales</button>
                <div className="breadcrumb">
                    <span className="platform-icon">{platform.includes('instagram') ? '📸' : platform.includes('facebook') ? '👥' : '🎬'}</span>
                    <span className="platform-path">Meta &gt; {platform.replace('-', ' ')}</span>
                </div>
                <div className="header-actions">
                    <div className="type-toggle">
                        <button className={!isAds ? 'active' : ''} onClick={() => setIsAds(false)}>Orgánico</button>
                        <button className={isAds ? 'active' : ''} onClick={() => setIsAds(true)}>ADS</button>
                    </div>
                </div>
            </div>

            <div className="main-layout">
                {/* LEFTBAR: EDITOR */}
                <aside className="editor-sidebar">
                    <div className="editor-content">
                        <h3>{activeSection ? activeSection : `Edita tu ${variant === 'story' ? 'historia' : 'publicación'}`}</h3>

                        {!activeSection ? (
                            <>
                                <p className="subtitle">Personaliza el contenido de tu {isAds ? 'anuncio' : 'publicación'}.</p>

                                <div className="form-section">
                                    <label>Fondo / Media ({selectedMedia.length})</label>
                                    <div className="media-gallery">
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            style={{ display: 'none' }}
                                            multiple
                                            accept="image/*,video/*"
                                            onChange={handleFileUpload}
                                        />
                                        <div className="gallery-item upload-card" onClick={() => fileInputRef.current?.click()}>
                                            <span className="plus-icon">+</span>
                                            <span className="upload-label">Subir</span>
                                        </div>

                                        {sanitizedVideos.length > 0 && (
                                            <div
                                                className={`gallery-item ${selectedMedia.some(m => m.url === sanitizedVideos[0].url) ? 'active' : ''}`}
                                                onClick={() => toggleMedia(sanitizedVideos[0].url, 'video')}
                                            >
                                                <video src={sanitizedVideos[0].url} muted />
                                                <span className="play-badge">▶</span>
                                                {selectedMedia.some(m => m.url === sanitizedVideos[0].url) && <span className="check-box">✓</span>}
                                            </div>
                                        )}
                                        {extraMedia.map((m, i) => (
                                            <div
                                                key={`extra-${i}`}
                                                className={`gallery-item ${selectedMedia.some(s => s.url === m.url) ? 'active' : ''}`}
                                                onClick={() => toggleMedia(m.url, m.type)}
                                            >
                                                {m.type === 'video' ? <video src={m.url} muted /> : <img src={m.url} alt="" />}
                                                {m.type === 'video' && <span className="play-badge">▶</span>}
                                                {selectedMedia.some(s => s.url === m.url) && <span className="check-box">✓</span>}
                                            </div>
                                        ))}

                                        {sanitizedImages.slice(0, 12).map((img, i) => (
                                            <div
                                                key={i}
                                                className={`gallery-item ${selectedMedia.some(m => m.url === img) ? 'active' : ''}`}
                                                onClick={() => toggleMedia(img, 'image')}
                                            >
                                                <img src={img} alt="" />
                                                {selectedMedia.some(m => m.url === img) && <span className="check-box">✓</span>}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="form-section">
                                    <label>Texto principal</label>
                                    <div className="input-with-limit">
                                        <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} />
                                        <span>{title.length}/100</span>
                                    </div>
                                </div>

                                <div className="form-section">
                                    <label>Descripción / Copy</label>
                                    <div className="input-with-limit">
                                        <textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} rows={4} />
                                        <span>{description.length}/500</span>
                                    </div>
                                </div>

                                <div className="form-section">
                                    <div className="label-with-action">
                                        <label>Hashtags</label>
                                        <button className="suggest-btn" onClick={handleSuggestHashtags}>✨ Sugerir con I.A.</button>
                                    </div>
                                    <textarea
                                        className="hashtags-input"
                                        value={hashtags}
                                        onChange={(e) => setHashtags(e.target.value)}
                                        placeholder="#realestate #luxury #home"
                                    />
                                </div>

                                {isAds && (
                                    <div className="form-section">
                                        <label>Botón (CTA)</label>
                                        <select value={cta} onChange={(e) => setCta(e.target.value)}>
                                            <option>Más información</option>
                                            <option>Consultar disponibilidad</option>
                                            <option>Contactar por WhatsApp</option>
                                            <option>Ver propiedad</option>
                                        </select>
                                    </div>
                                )}

                                {isAds && (
                                    <div className="advanced-sections">
                                        <div className="advanced-item" onClick={() => setActiveSection('Estilo y colores')}>
                                            <div className="adv-label"><span className="adv-icon">🎨</span> Estilo y colores</div>
                                            <span>&gt;</span>
                                        </div>
                                        <div className="advanced-item" onClick={() => setActiveSection('Audiencia')}>
                                            <div className="adv-label"><span className="adv-icon">🎯</span> Audiencia</div>
                                            <span>&gt;</span>
                                        </div>
                                        <div className="advanced-item" onClick={() => setActiveSection('Presupuesto')}>
                                            <div className="adv-label"><span className="adv-icon">💰</span> Presupuesto</div>
                                            <span>&gt;</span>
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="section-panel">
                                <button className="panel-back" onClick={() => setActiveSection(null)}>← Volver al editor</button>

                                <div className="panel-content">
                                    {activeSection === 'Estilo y colores' && (
                                        <>
                                            <div className="control-group">
                                                <label>Color de acento</label>
                                                <div className="color-grid">
                                                    <div className="color-box" style={{ background: '#b08d6d' }}></div>
                                                    <div className="color-box" style={{ background: '#2c241e' }}></div>
                                                    <div className="color-box" style={{ background: '#007bff' }}></div>
                                                    <div className="color-box" style={{ background: '#e91e63' }}></div>
                                                </div>
                                            </div>
                                            <div className="control-group">
                                                <label>Tipografía</label>
                                                <select><option>Modern Sans</option><option>Elegant Serif</option></select>
                                            </div>
                                        </>
                                    )}

                                    {activeSection === 'Audiencia' && (
                                        <>
                                            <div className="control-group">
                                                <label>Ubicación</label>
                                                <input placeholder="Ej: Madrid, España" defaultValue={data.city} />
                                            </div>
                                            <div className="control-group">
                                                <label>Intereses</label>
                                                <div className="tag-list">
                                                    <span className="tag active">Inmuebles</span>
                                                    <span className="tag">Lujo</span>
                                                    <span className="tag">Inversión</span>
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {activeSection === 'Presupuesto' && (
                                        <>
                                            <div className="control-group">
                                                <label>Presupuesto diario (€)</label>
                                                <input type="number" defaultValue="10" />
                                            </div>
                                            <div className="control-group">
                                                <label>Duración (días)</label>
                                                <input type="range" min="1" max="30" defaultValue="7" />
                                                <div className="range-labels"><span>1d</span><span>30d</span></div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                </aside>

                {/* CENTER: PREVIEW */}
                <main className="preview-area">
                    <div className="preview-container">
                        <div className="preview-header">
                            <span>Vista previa</span>
                            <div className="view-controls">
                                <span className="active">👁️</span>
                                <span>📱</span>
                            </div>
                        </div>

                        <div className={`preview-mockup ${variant} ${isGoogleAds ? 'google-ads-preview' : ''}`}>
                            {isGoogleAds ? (
                                <>
                                    {variant === 'search' ? (
                                        <div className="google-search-ad">
                                            <div className="google-sponsored">
                                                <span>Patrocinado</span>
                                                <span className="dots-menu">⋮</span>
                                            </div>
                                            <div className="google-site-info">
                                                <div className="google-favicon">
                                                    <img src="/images/solo smm.png" alt="Favicon" />
                                                </div>
                                                <div className="google-site-names">
                                                    <span className="google-domain">{destinationUrl ? destinationUrl.replace('https://', '').split('/')[0] : 'mhestate.es'}</span>
                                                    <span className="google-path">{destinationUrl ? '/' + destinationUrl.replace('https://', '').split('/').slice(1).join('/') : ''}</span>
                                                </div>
                                            </div>
                                            <h3 className="google-title">
                                                {title ? title : 'Título del anuncio'} | Inmobiliaria de confianza
                                            </h3>
                                            <p className="google-desc">
                                                {description ? description : 'Descripción del anuncio de Google Ads. Introduce detalles importantes para atraer clics.'}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="google-display-ad">
                                            <div className="display-banner-image">
                                                {selectedMedia.length > 0 ? (
                                                    <img src={selectedMedia[0].url} alt="Banner" />
                                                ) : (
                                                    <div className="display-banner-placeholder">Carga o selecciona una imagen</div>
                                                )}
                                            </div>
                                            <div className="display-banner-content">
                                                <div className="display-banner-header">
                                                    <img src="/images/solo smm.png" className="display-logo" alt="Logo" />
                                                    <span className="display-brand">NewHomes</span>
                                                </div>
                                                <h4 className="display-headline">{title ? title : 'Título del anuncio'}</h4>
                                                <p className="display-description">{description ? description : 'Descripción corta del banner.'}</p>
                                                <button className="display-cta-btn">{cta} ➔</button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : ['story', 'reels', 'shorts'].includes(variant) ? (
                                <div className={`ig-preview-mockup ${variant}`}>
                                    <div className="status-bar"></div>
                                    <header>
                                        <div className="avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                            {isFacebook && <img src="/images/facebook.png" alt="Facebook" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />}
                                            {isInstagram && <img src="/images/instagram.png" alt="Instagram" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />}
                                            {isYouTube && <img src="/images/youtube.png" alt="YouTube" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />}
                                            {!isFacebook && !isInstagram && !isYouTube && <img src="/images/solo smm.png" alt="SMM" style={{ width: '100%', height: '100%', objectFit: 'scale-down' }} />}
                                        </div>
                                        <div className="names">
                                            <b>NewHomes</b>
                                            <span>{variant === 'reels' ? 'Original Audio' : (isAds ? 'Publicidad' : 'Orgánico')}</span>
                                        </div>
                                    </header>
                                    <div className="media-container">
                                        {selectedMedia.length > 0 ? (
                                            <>
                                                {selectedMedia[carouselIndex].type === 'video' ? (
                                                    selectedMedia[carouselIndex].url.includes('youtube.com') || selectedMedia[carouselIndex].url.includes('youtu.be') ? (
                                                        <iframe
                                                            key={selectedMedia[carouselIndex].url}
                                                            src={`https://www.youtube.com/embed/${selectedMedia[carouselIndex].url.includes('v=') ? selectedMedia[carouselIndex].url.split('v=')[1].split('&')[0] : selectedMedia[carouselIndex].url.split('/').pop()?.split('?')[0]}?autoplay=1&mute=1&loop=1`}
                                                            style={{ width: '100%', height: '100%', border: 'none' }}
                                                            allow="autoplay; encrypted-media"
                                                            allowFullScreen
                                                        />
                                                    ) : (
                                                        <video key={selectedMedia[carouselIndex].url} src={selectedMedia[carouselIndex].url} autoPlay muted loop />
                                                    )
                                                ) : (
                                                    <img src={selectedMedia[carouselIndex].url} alt="" />
                                                )}

                                                {selectedMedia.length > 1 && (
                                                    <div className="carousel-controls">
                                                        <button onClick={prevMedia} className="car-arrow">‹</button>
                                                        <div className="car-dots">
                                                            {selectedMedia.map((_, i) => (
                                                                <span key={i} className={`dot ${i === carouselIndex ? 'active' : ''}`} />
                                                            ))}
                                                        </div>
                                                        <button onClick={nextMedia} className="car-arrow">›</button>
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <div className="media-placeholder">Sin multimedia</div>
                                        )}
                                    </div>
                                    <div className="overlay-text">
                                        <h2>{title}</h2>
                                        <p>{description}</p>
                                        <p className="p-hashtags">{hashtags}</p>
                                    </div>
                                    {isAds && (
                                        <div className="cta-area">
                                            <button>{cta}</button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className={`fb-preview-mockup ${variant}`}>
                                    <header>
                                        <div className="avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                            {isFacebook && <img src="/images/facebook.png" alt="Facebook" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />}
                                            {isInstagram && <img src="/images/instagram.png" alt="Instagram" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />}
                                            {isYouTube && <img src="/images/youtube.png" alt="YouTube" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />}
                                            {!isFacebook && !isInstagram && !isYouTube && <img src="/images/solo smm.png" alt="SMM" style={{ width: '100%', height: '100%', objectFit: 'scale-down' }} />}
                                        </div>
                                        <div className="names">
                                            <b>NewHomes</b>
                                            <span>{isYouTube ? '12.5 K suscriptores' : (isAds ? 'Publicidad' : 'Orgánico')}</span>
                                        </div>
                                    </header>
                                    <div className="text-content">
                                        {title}
                                    </div>
                                    <div className="media-container fb-mosaic-grid">
                                        {selectedMedia.length === 0 ? (
                                            <div className="media-placeholder">Sin multimedia</div>
                                        ) : (() => {
                                            // Helper to render a single media item
                                            const renderItem = (m: { url: string, type: string }, key: string | number, style?: React.CSSProperties) => {
                                                if (m.type === 'video') {
                                                    if (m.url.includes('youtube.com') || m.url.includes('youtu.be')) {
                                                        const videoId = m.url.includes('v=')
                                                            ? m.url.split('v=')[1].split('&')[0]
                                                            : m.url.split('/').pop()?.split('?')[0];
                                                        return (
                                                            <iframe
                                                                key={key}
                                                                src={`https://www.youtube.com/embed/${videoId}`}
                                                                style={{ width: '100%', height: '100%', border: 'none', ...(style || {}) }}
                                                                allowFullScreen
                                                            />
                                                        );
                                                    }
                                                    return <video key={key} src={m.url} autoPlay muted loop style={style} />;
                                                }
                                                return <img key={key} src={m.url} alt="" style={style} />;
                                            };

                                            // ─── If there's a video, always put it full-width first ───
                                            const videoItem = selectedMedia.find(m => m.type === 'video');
                                            const imageItems = selectedMedia.filter(m => m.type !== 'video');

                                            if (videoItem) {
                                                return (
                                                    <>
                                                        {/* Video — full width */}
                                                        <div className="mosaic-single" style={{ borderRadius: imageItems.length > 0 ? '8px 8px 0 0' : '8px', overflow: 'hidden' }}>
                                                            {renderItem(videoItem, 'video-primary')}
                                                            <span style={{
                                                                position: 'absolute', bottom: 8, left: 8,
                                                                background: 'rgba(0,0,0,0.6)', color: '#fff',
                                                                fontSize: '0.65rem', padding: '2px 6px', borderRadius: 4,
                                                                display: 'flex', alignItems: 'center', gap: 4
                                                            }}>▶ Video</span>
                                                        </div>

                                                        {/* Additional images strip below video */}
                                                        {imageItems.length > 0 && (
                                                            <div style={{
                                                                display: 'grid',
                                                                gridTemplateColumns: `repeat(${Math.min(imageItems.length, 4)}, 1fr)`,
                                                                gap: '2px',
                                                                marginTop: '2px',
                                                                maxHeight: '80px',
                                                                borderRadius: '0 0 8px 8px',
                                                                overflow: 'hidden'
                                                            }}>
                                                                {imageItems.slice(0, 4).map((m, i) => (
                                                                    <div key={i} style={{ position: 'relative', overflow: 'hidden', height: '80px' }}>
                                                                        <img src={m.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                                        {i === 3 && imageItems.length > 4 && (
                                                                            <div className="mosaic-overlay">+{imageItems.length - 4}</div>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </>
                                                );
                                            }

                                            // ─── Pure image mosaic (no video) ───
                                            if (selectedMedia.length === 1) {
                                                return <div className="mosaic-single">{renderItem(selectedMedia[0], 0)}</div>;
                                            } else if (selectedMedia.length === 2) {
                                                return (
                                                    <div className="mosaic-row-2">
                                                        {selectedMedia.slice(0, 2).map((m, i) => (
                                                            <div key={i} className="mosaic-cell">{renderItem(m, i)}</div>
                                                        ))}
                                                    </div>
                                                );
                                            } else if (selectedMedia.length === 3) {
                                                return (
                                                    <>
                                                        <div className="mosaic-row-2">
                                                            {selectedMedia.slice(0, 2).map((m, i) => (
                                                                <div key={i} className="mosaic-cell">{renderItem(m, i)}</div>
                                                            ))}
                                                        </div>
                                                        <div className="mosaic-row-3">
                                                            <div className="mosaic-cell">{renderItem(selectedMedia[2], 2)}</div>
                                                        </div>
                                                    </>
                                                );
                                            } else if (selectedMedia.length === 4) {
                                                return (
                                                    <>
                                                        <div className="mosaic-row-2">
                                                            {selectedMedia.slice(0, 2).map((m, i) => (
                                                                <div key={i} className="mosaic-cell">{renderItem(m, i)}</div>
                                                            ))}
                                                        </div>
                                                        <div className="mosaic-row-2">
                                                            {selectedMedia.slice(2, 4).map((m, i) => (
                                                                <div key={i} className="mosaic-cell">{renderItem(m, i + 2)}</div>
                                                            ))}
                                                        </div>
                                                    </>
                                                );
                                            } else {
                                                return (
                                                    <>
                                                        <div className="mosaic-row-2">
                                                            {selectedMedia.slice(0, 2).map((m, i) => (
                                                                <div key={i} className="mosaic-cell">{renderItem(m, i)}</div>
                                                            ))}
                                                        </div>
                                                        <div className="mosaic-row-3">
                                                            {selectedMedia.slice(2, 5).map((m, i) => (
                                                                <div key={i} className="mosaic-cell" style={{ position: 'relative' }}>
                                                                    {renderItem(m, i + 2)}
                                                                    {i === 2 && selectedMedia.length > 5 && (
                                                                        <div className="mosaic-overlay">+{selectedMedia.length - 5}</div>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </>
                                                );
                                            }
                                        })()}
                                    </div>

                                    <footer>
                                        <div className="footer-meta">
                                            <b>{destinationUrl ? destinationUrl.replace('https://', '').split('/')[0] : 'enlace'}</b>
                                            <h3 style={{ fontSize: '1rem', margin: '4px 0' }}>{title}</h3>
                                            <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>{description} <span style={{ color: '#b08d6d' }}>{hashtags}</span></p>
                                        </div>
                                        {isAds && <button className="cta-btn">{cta}</button>}
                                    </footer>
                                </div>
                            )}
                        </div>
                    </div>
                </main>

                {/* RIGHTBAR: VARIANT SELECTOR */}
                <aside className="variant-sidebar">
                    <h4 className="sidebar-title">Formato del anuncio</h4>
                    <div className="variant-list">
                        {platformVariants.map(v => (
                            <div
                                key={v.id}
                                className={`variant-item ${variant === v.id ? 'active' : ''}`}
                                onClick={() => setVariant(v.id)}
                            >
                                <span className="icon">{v.icon}</span>
                                <span className="label">{v.label}</span>
                            </div>
                        ))}
                    </div>

                    <button className="publish-now-btn sidebar-publish" onClick={handlePublishLocal}>
                        🚀 Publicar ahora
                    </button>

                    <div className="ai-tip">
                        <span className="ai-icon">✨</span>
                        <p>Hemos optimizado el diseño para {variant}. Puedes editar textos y elementos para que se adapten a tu marca.</p>
                    </div>
                </aside>
            </div >

            {/* Mobile/Tablet Fallback Publish Button */}
            < div className="mobile-publish-footer" >
                <button className="publish-now-btn" style={{ minWidth: '220px' }} onClick={handlePublishLocal}>🚀 Publicar ahora</button>
            </div >



            <style jsx>{`
        .ad-editor-screen {
          flex: 1;
          display: flex;
          flex-direction: column;
          background-color: var(--bg-primary);
          color: var(--text-primary);
          height: 100vh;
          overflow: hidden;
        }

        .top-nav {
          height: 70px;
          display: flex;
          align-items: center;
          padding: 0 40px;
          border-bottom: 1px solid rgba(0,0,0,0.05);
          background: white;
          gap: 24px;
        }

        .back-btn { font-size: 0.9rem; opacity: 0.6; }
        .breadcrumb { flex: 1; display: flex; align-items: center; gap: 8px; font-size: 0.9rem; font-weight: 500; }
        .platform-icon { font-size: 1.2rem; }
        
        .type-toggle {
           background: #f5f5f5;
           border-radius: 30px;
           padding: 4px;
           display: flex;
           gap: 4px;
        }
        .type-toggle button {
           border: none;
           padding: 6px 16px;
           border-radius: 20px;
           font-size: 0.8rem;
           font-weight: 600;
           cursor: pointer;
           transition: all 0.2s;
        }
        .type-toggle button.active {
           background: white;
           box-shadow: 0 2px 8px rgba(0,0,0,0.1);
           color: var(--accent-primary);
        }

        .header-actions { display: flex; align-items: center; gap: 16px; }
        .secondary-action { border: 1px solid #eee; padding: 6px 16px; border-radius: 20px; font-size: 0.8rem; }
        .avatar { width: 32px; height: 32px; background: var(--accent-primary); color: white; border-radius: 50%; font-size: 0.7rem; font-weight: 700; }

        .main-layout {
          flex: 1;
          display: flex;
          overflow: hidden;
        }

        .editor-sidebar {
          width: 380px;
          background: white;
          display: flex;
          flex-direction: column;
          border-right: 1px solid rgba(0,0,0,0.05);
        }

        .editor-content {
          flex: 1;
          overflow-y: auto;
          padding: 30px;
        }

        .editor-content h3 { font-size: 1.4rem; margin-bottom: 8px; }
        .subtitle { font-size: 0.85rem; opacity: 0.5; margin-bottom: 30px; }

        .form-section { margin-bottom: 24px; }
        .form-section label { display: block; font-size: 0.8rem; font-weight: 600; margin-bottom: 12px; opacity: 0.7; }
        
        .media-gallery {
           display: grid;
           grid-template-columns: repeat(4, 1fr);
           gap: 8px;
        }

        .gallery-item {
           aspect-ratio: 1;
           background: #eee;
           border-radius: 8px;
           overflow: hidden;
           cursor: pointer;
           border: 2px solid transparent;
           position: relative;
           transition: all 0.2s;
        }
        .upload-card {
            border: 2px dashed #b08d6d;
            background: #fff;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: #b08d6d;
        }
        .plus-icon { font-size: 1.2rem; font-weight: bold; line-height: 1; }
        .upload-label { font-size: 0.6rem; text-transform: uppercase; font-weight: 700; margin-top: 2px; }

        .gallery-item.active {
           border-color: var(--accent-primary);
           transform: scale(0.95);
        }

        .gallery-item img, .gallery-item video {
           width: 100%;
           height: 100%;
           object-fit: cover;
        }

        .check-box {
           position: absolute;
           top: 5px;
           right: 5px;
           background: var(--accent-primary);
           color: white;
           width: 18px;
           height: 18px;
           border-radius: 50%;
           display: flex;
           align-items: center;
           justify-content: center;
           font-size: 0.7rem;
           font-weight: bold;
           border: 1px solid white;
        }

        .hashtags-input {
           width: 100%;
           border: 1px solid #efeee9;
           background: #fdfcfb;
           padding: 12px 16px;
           border-radius: 8px;
           font-size: 0.9rem;
           color: var(--accent-primary);
           outline: none;
           resize: vertical;
        }

        .label-with-action {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
        }
        .label-with-action label { margin-bottom: 0 !important; }
        
        .suggest-btn {
            background: none;
            border: none;
            color: var(--accent-primary);
            font-size: 0.75rem;
            font-weight: 700;
            cursor: pointer;
            padding: 4px 8px;
            border-radius: 6px;
            transition: all 0.2s;
        }
        .suggest-btn:hover { background: var(--accent-glow); }

        .input-with-limit { position: relative; }
        .input-with-limit input, .input-with-limit textarea {
           width: 100%;
           border: 1px solid #efeee9;
           background: #fdfcfb;
           padding: 12px 16px;
           border-radius: 8px;
           font-size: 0.95rem;
           outline: none;
        }
        .input-with-limit span { position: absolute; right: 12px; top: 12px; font-size: 0.7rem; opacity: 0.4; pointer-events: none; }

        select { width: 100%; border: 1px solid #efeee9; background: #fdfcfb; padding: 12px 16px; border-radius: 8px; outline: none; appearance: none; }

        .advanced-sections { margin-top: 40px; }
        .advanced-item { 
           padding: 16px 0; 
           border-top: 1px solid #f5f5f5; 
           font-size: 0.85rem; 
           font-weight: 600; 
           opacity: 0.8; 
           display: flex; 
           justify-content: space-between; 
           cursor: pointer; 
           align-items: center;
        }
        .advanced-item:hover { opacity: 1; color: var(--accent-primary); }
        .adv-label { display: flex; align-items: center; gap: 12px; }
        .adv-icon { font-size: 1.1rem; }

        .section-panel { display: flex; flex-direction: column; }
        .panel-back { background: none; border: none; color: var(--accent-primary); font-weight: 700; text-align: left; margin-bottom: 20px; cursor: pointer; }
        .control-group { margin-bottom: 24px; }
        .control-group label { display: block; font-size: 0.8rem; font-weight: 600; margin-bottom: 8px; }
        .color-grid { display: flex; gap: 8px; }
        .color-box { width: 30px; height: 30px; border-radius: 50%; cursor: pointer; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .tag-list { display: flex; flex-wrap: wrap; gap: 8px; }
        .tag { background: #f5f5f5; padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; }
        .tag.active { background: var(--accent-primary); color: white; }

        .sidebar-footer { padding: 20px 30px; border-top: 1px solid #f5f5f5; }
        .save-draft { font-size: 0.85rem; opacity: 0.5; font-weight: 600; }

        .preview-area {
          flex: 1;
          background: #f7f3f0;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding: 20px 40px;
        }

        .preview-container {
          width: 100%;
          max-width: 900px;
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .preview-header { display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 0.8rem; font-weight: 600; opacity: 0.5; }
        .view-controls { display: flex; gap: 12px; }
        .view-controls .active { opacity: 1; color: #b08d6d; }

        .preview-mockup {
           margin: 0 auto;
           background: white;
           box-shadow: 0 20px 50px rgba(0,0,0,0.1);
           border-radius: 20px;
           overflow: hidden;
           transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .preview-mockup.story, .preview-mockup.reels, .preview-mockup.shorts { width: 300px; height: 533px; }
        .preview-mockup.feed, .preview-mockup.video, .preview-mockup.display { width: 500px; min-height: 500px; }
        .preview-mockup.search { width: 500px; height: 150px; }

        /* INSTAGRAM PREVIEW */
        .ig-preview-mockup { position: relative; height: 100%; background: #000; color: white; display: flex; flex-direction: column; }
        .ig-preview-mockup header { padding: 15px; display: flex; align-items: center; gap: 10px; z-index: 2; position: relative; }
        .ig-preview-mockup header .avatar { width: 32px; height: 32px; background: #eee; border-radius: 50%; }
        .ig-preview-mockup .media-container { position: absolute; inset: 0; }
        .ig-preview-mockup .media-container img, .ig-preview-mockup .media-container video { width: 100%; height: 100%; object-fit: cover; opacity: 0.8; }
        .ig-preview-mockup .overlay-text { position: absolute; top: 120px; left: 30px; right: 30px; text-shadow: 0 2px 4px rgba(0,0,0,0.5); z-index: 3; }
        .ig-preview-mockup .overlay-text h2 { font-size: 1.8rem; margin-bottom: 8px; }
        .ig-preview-mockup .overlay-text .p-hashtags { font-size: 0.8rem; color: #b08d6d; font-weight: 600; margin-top: 8px; }
        .ig-preview-mockup .cta-area { position: absolute; bottom: 40px; left: 0; right: 0; text-align: center; z-index: 3; }
        .ig-preview-mockup .cta-area button { background: white; color: black; border: none; border-radius: 8px; padding: 10px 24px; font-weight: 600; box-shadow: 0 4px 12px rgba(0,0,0,0.2); }

        /* FACEBOOK PREVIEW */
        .fb-preview-mockup { background: white; color: #1c1e21; display: flex; flex-direction: column; width: 100%; }
        .fb-preview-mockup header { padding: 12px; display: flex; align-items: center; gap: 8px; }
        .fb-preview-mockup header .avatar { width: 36px; height: 36px; background: #eee; border-radius: 50%; }
        .fb-preview-mockup header .names b { display: block; font-size: 0.9rem; }
        .fb-preview-mockup header .names span { font-size: 0.75rem; opacity: 0.6; }
        .fb-preview-mockup .text-content { padding: 0 12px 12px 12px; font-size: 0.9rem; line-height: 1.4; color: #1c1e21; }
        
        .fb-preview-mockup .media-container { width: 100%; position: relative; background: #f0f2f5; overflow: hidden; }
        
        .fb-preview-mockup footer { 
           padding: 12px; 
           background: #f0f2f5; 
           display: flex; 
           justify-content: space-between; 
           align-items: center; 
           border-top: 1px solid #ddd;
           position: relative;
           z-index: 1;
        }
        .footer-meta { flex: 1; margin-right: 12px; display: flex; flex-direction: column; }
        .fb-preview-mockup .cta-btn { background: #fff; border: 1px solid #ddd; padding: 8px 16px; border-radius: 6px; font-weight: 600; font-size: 0.85rem; color: #1c1e21; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }

        /* FB MOSAIC GRID — new */
        .fb-mosaic-grid {
          display: flex;
          flex-direction: column;
          gap: 3px;
          background: #f0f2f5;
        }

        .mosaic-single {
          width: 100%;
          height: 350px;
        }
        .mosaic-single img,
        .mosaic-single video,
        .mosaic-single iframe { width: 100%; height: 100%; object-fit: cover; display: block; }

        .mosaic-row-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 3px;
          height: 200px;
        }

        .mosaic-row-3 {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 3px;
          height: 150px;
        }

        .mosaic-cell {
          overflow: hidden;
          position: relative;
        }
        .mosaic-cell img,
        .mosaic-cell video { width: 100%; height: 100%; object-fit: cover; display: block; }

        .mosaic-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.55);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.8rem;
          font-weight: 700;
          letter-spacing: 1px;
        }

        .grid-overlay {
           position: absolute;
           inset: 0;
           background: rgba(0,0,0,0.5);
           color: white;
           display: flex;
           align-items: center;
           justify-content: center;
           font-size: 1.5rem;
           font-weight: 700;
        }


        /* CAROUSEL COMMON */
        .carousel-controls, .carousel-nav-fb {
           position: absolute;
           bottom: 15px;
           left: 0;
           right: 0;
           display: flex;
           justify-content: space-between;
           align-items: center;
           padding: 0 10px;
           z-index: 10;
        }

        .car-arrow, .fb-arrow {
           background: rgba(255,255,255,0.2);
           border: none;
           color: white;
           width: 30px;
           height: 30px;
           border-radius: 50%;
           cursor: pointer;
           font-size: 1.2rem;
           display: flex;
           align-items: center;
           justify-content: center;
           backdrop-filter: blur(4px);
        }

        .car-dots, .fb-dots { display: flex; gap: 6px; }
        .dot { width: 6px; height: 6px; background: rgba(255,255,255,0.3); border-radius: 50%; }
        .dot.active { background: white; transform: scale(1.2); }

        .fb-arrow { background: rgba(0,0,0,0.4); }

        .variant-sidebar {
           width: 280px;
           background: white;
           border-left: 1px solid rgba(0,0,0,0.05);
           padding: 30px;
           display: flex;
           flex-direction: column;
        }

        .sidebar-title {
           font-size: 0.8rem;
           font-weight: 700;
           text-transform: uppercase;
           letter-spacing: 1px;
           opacity: 0.4;
           margin-bottom: 20px;
        }

        .variant-list {
           display: flex;
           flex-direction: column;
           gap: 12px;
        }

        .variant-item {
           padding: 16px;
           border: 1px solid #efeee9;
           border-radius: 16px;
           display: flex;
           align-items: center;
           gap: 12px;
           cursor: pointer;
           transition: all 0.2s;
        }
        .variant-item:hover { border-color: #b08d6d; }
        .variant-item.active { border-color: #b08d6d; background: #fdfcfb; box-shadow: 0 4px 12px rgba(0,0,0,0.02); }
        .variant-item.active .icon { background: white; box-shadow: 0 2px 6px rgba(0,0,0,0.1); }
        .variant-item .icon { width: 40px; height: 40px; background: #fbfafa; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; }
        .variant-item .label { font-weight: 600; font-size: 0.9rem; }

        .ai-tip { margin-top: auto; background: #fdfcfb; border-radius: 16px; padding: 20px; border: 1px solid #efeee9; }
        .ai-icon { font-size: 1.5rem; display: block; margin-bottom: 12px; }
        .ai-tip p { font-size: 0.75rem; line-height: 1.5; opacity: 0.6; }

        .sidebar-publish {
          width: 100%;
          margin-top: 20px;
          margin-bottom: 20px;
          padding: 14px 24px;
          font-size: 1rem;
          cursor: pointer;
          text-align: center;
          display: block;
        }

        .mobile-publish-footer {
          display: none;
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          height: 70px;
          background: white;
          border-top: 1px solid rgba(0,0,0,0.05);
          align-items: center;
          justify-content: center;
          padding: 0 20px;
          z-index: 999;
          box-shadow: 0 -4px 12px rgba(0,0,0,0.05);
        }

        .publish-now-btn { background: #b08d6d; color: white; border: none; padding: 12px 32px; border-radius: 30px; font-weight: 700; font-size: 0.9rem; box-shadow: 0 10px 20px rgba(176, 141, 109, 0.2); transition: all 0.2s; }
        .publish-now-btn:hover { background: #9a7b5d; transform: translateY(-2px); box-shadow: 0 12px 24px rgba(176, 141, 109, 0.3); }


        /* GOOGLE ADS SEARCH MOCKUP - wrapper override */
        .preview-mockup.google-ads-preview.search {
            width: 500px;
            min-height: unset !important;
            height: auto !important;
            border-radius: 12px;
            padding: 16px;
            background: white;
            box-sizing: border-box;
            border: 1px solid #dadce0;
            box-shadow: 0 4px 12px rgba(0,0,0,0.08) !important;
            font-family: Arial, sans-serif;
            text-align: left;
        }
        .google-sponsored {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 12px;
            color: #202124;
            font-weight: bold;
            margin-bottom: 6px;
        }
        .google-site-info {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 6px;
        }
        .google-favicon {
            width: 18.01px;
            height: 18.01px;
            border-radius: 50%;
            background: #f1f3f4;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
        }
        .google-favicon img {
            width: 12px;
            height: 12px;
            object-fit: contain;
        }
        .google-site-names {
            display: flex;
            flex-direction: column;
            line-height: 1.2;
        }
        .google-domain {
            font-size: 12px;
            color: #202124;
            font-weight: 500;
        }
        .google-path {
            font-size: 11px;
            color: #5f6368;
        }
        .google-title {
            font-size: 20px;
            color: #1a0dab;
            font-weight: 400;
            margin: 4px 0 6px 0;
            font-family: Roboto, Arial, sans-serif;
            line-height: 1.3;
            text-decoration: none;
            cursor: pointer;
        }
        .google-title:hover {
            text-decoration: underline;
        }
        .google-desc {
            font-size: 14px;
            color: #4d5156;
            line-height: 1.57;
            margin: 0;
        }

        /* GOOGLE ADS DISPLAY MOCKUP - wrapper override */
        .preview-mockup.google-ads-preview.display {
            width: 500px;
            min-height: unset !important;
            height: 250px !important;
            border-radius: 12px;
            overflow: hidden;
            display: flex;
            background: #f8f9fa;
            border: 1px solid #dadce0;
            box-shadow: 0 4px 12px rgba(0,0,0,0.08) !important;
            font-family: Roboto, Arial, sans-serif;
            text-align: left;
        }
        .google-display-ad {
            display: flex;
            width: 100%;
            height: 100%;
        }
        .display-banner-image {
            flex: 1.2;
            height: 100%;
            background: #000;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
        }
        .display-banner-image img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        .display-banner-placeholder {
            color: #888;
            font-size: 12px;
            text-align: center;
            padding: 10px;
        }
        .display-banner-content {
            flex: 1;
            padding: 16px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            background: white;
            border-left: 1px solid #f1f3f4;
            box-sizing: border-box;
        }
        .display-banner-header {
            display: flex;
            align-items: center;
            gap: 6px;
            margin-bottom: 6px;
        }
        .display-logo {
            width: 16px;
            height: 16px;
            object-fit: contain;
        }
        .display-brand {
            font-size: 11px;
            font-weight: bold;
            color: #5f6368;
            letter-spacing: 0.5px;
            text-transform: uppercase;
        }
        .display-headline {
            font-size: 15px;
            font-weight: 500;
            color: #202124;
            margin: 0 0 6px 0;
            line-height: 1.3;
            display: -webkit-box;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }
        .display-description {
            font-size: 12px;
            color: #5f6368;
            margin: 0;
            line-height: 1.4;
            display: -webkit-box;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }
        .display-cta-btn {
            align-self: flex-start;
            background: #1a73e8;
            color: white;
            border: none;
            padding: 8px 14px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 500;
            cursor: pointer;
            transition: background 0.2s;
            margin-top: 8px;
        }
        .display-cta-btn:hover {
            background: #1557b0;
        }

        @media (max-width: 1200px) {
           .variant-sidebar { display: none; }
           .mobile-publish-footer { 
             display: flex; 
             position: sticky; 
             bottom: 0; 
             background: white;
             z-index: 999;
             padding: 15px;
             border-top: 1px solid rgba(0,0,0,0.05);
           }
        }

        @media (max-width: 900px) {
          .ad-editor-screen {
            height: auto;
            overflow-y: auto;
          }
          .main-layout {
            flex-direction: column;
            overflow: visible;
          }
          .editor-sidebar {
            width: 100%;
            border-right: none;
            border-bottom: 1px solid rgba(0,0,0,0.05);
          }
          .preview-area {
            width: 100%;
            padding: 20px 10px;
            margin-bottom: 80px; /* Keep bottom space for sticky footer */
          }
          .preview-mockup.feed, .preview-mockup.video, .preview-mockup.display {
            width: 100%;
            max-width: 500px;
          }
        }

      `}</style>
        </div >
    );
}
