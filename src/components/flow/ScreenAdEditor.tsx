"use client";

import { useState, useEffect } from "react";
import { ScrapedData, Platform } from "./UnifiedFlow";

type Props = {
    data: ScrapedData;
    platform: Platform;
    onPublish: () => void;
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

    useEffect(() => {
        if (platform === 'youtube' || platform === 'instagram' || platform === 'facebook') {
            setIsAds(false);
        }
    }, [platform]);

    // Multi-media selection
    const [selectedMedia, setSelectedMedia] = useState<{ url: string, type: 'image' | 'video' }[]>(
        (data.videos && data.videos.length > 0)
            ? [{ url: data.videos[0].url, type: 'video' }]
            : (data.images && data.images.length > 0) ? [{ url: data.images[0], type: 'image' }] : []
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

    useEffect(() => {
        if (carouselIndex >= selectedMedia.length) {
            setCarouselIndex(0);
        }
    }, [selectedMedia, carouselIndex]);

    const nextMedia = () => setCarouselIndex((prev) => (prev + 1) % selectedMedia.length);
    const prevMedia = () => setCarouselIndex((prev) => (prev - 1 + selectedMedia.length) % selectedMedia.length);

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
                                        {data.videos && data.videos.length > 0 && (
                                            <div
                                                className={`gallery-item ${selectedMedia.some(m => m.url === data.videos[0].url) ? 'active' : ''}`}
                                                onClick={() => toggleMedia(data.videos[0].url, 'video')}
                                            >
                                                <video src={data.videos[0].url} muted />
                                                <span className="play-badge">▶</span>
                                                {selectedMedia.some(m => m.url === data.videos[0].url) && <span className="check-box">✓</span>}
                                            </div>
                                        )}
                                        {data.images.slice(0, 12).map((img, i) => (
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
                                    <label>Hashtags</label>
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

                    <div className="sidebar-footer">
                        <button className="save-draft">Guardar borrador</button>
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

                        <div className={`preview-mockup ${variant}`}>
                            {['story', 'reels', 'shorts'].includes(variant) ? (
                                <div className={`ig-preview-mockup ${variant}`}>
                                    <div className="status-bar"></div>
                                    <header>
                                        <div className="avatar">
                                            <img src="/images/instagram.png" alt="IG" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
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
                                        <div className="avatar"></div>
                                        <div className="names">
                                            <b>NewHomes</b>
                                            <span>{isYouTube ? '12.5 K suscriptores' : (isAds ? 'Publicidad' : 'Orgánico')}</span>
                                        </div>
                                    </header>
                                    <div className="text-content">
                                        {title}
                                    </div>
                                    <div className="media-container fb-grid">
                                        {selectedMedia.length === 0 ? (
                                            <div className="media-placeholder">Sin multimedia</div>
                                        ) : selectedMedia.length === 1 ? (
                                            <div className="single-media" style={{ height: '100%', width: '100%' }}>
                                                {selectedMedia[0]?.type === 'video' ? (
                                                    selectedMedia[0].url.includes('youtube.com') || selectedMedia[0].url.includes('youtu.be') ? (
                                                        <iframe
                                                            src={`https://www.youtube.com/embed/${selectedMedia[0].url.includes('v=') ? selectedMedia[0].url.split('v=')[1].split('&')[0] : selectedMedia[0].url.split('/').pop()?.split('?')[0]}`}
                                                            style={{ width: '100%', height: '400px', border: 'none' }}
                                                            allowFullScreen
                                                        />
                                                    ) : (
                                                        <video src={selectedMedia[0].url} autoPlay muted loop style={{ width: '100%', height: 'auto' }} />
                                                    )
                                                ) : (
                                                    <img src={selectedMedia[0]?.url} alt="" style={{ width: '100%', height: 'auto' }} />
                                                )}
                                            </div>
                                        ) : selectedMedia.length === 2 ? (
                                            <div className="fb-grid-2">
                                                {selectedMedia.slice(0, 2).map((m, i) => (
                                                    <div key={i} className="fb-grid-item">
                                                        {m?.type === 'video' ? (
                                                            m.url.includes('youtube.com') || m.url.includes('youtu.be') ? (
                                                                <div style={{ height: '100%', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>▶️ YT</div>
                                                            ) : (
                                                                <video src={m.url} muted />
                                                            )
                                                        ) : (
                                                            <img src={m?.url} alt="" />
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            /* Fallback for multi-media grid - simplified for brevity and stability */
                                            <div className="fb-grid-mosaic">
                                                <div className="fb-grid-main">
                                                    {selectedMedia[0]?.type === 'video' ? (
                                                        selectedMedia[0].url.includes('youtube.com') || selectedMedia[0].url.includes('youtu.be') ? (
                                                            <iframe
                                                                src={`https://www.youtube.com/embed/${selectedMedia[0].url.includes('v=') ? selectedMedia[0].url.split('v=')[1].split('&')[0] : selectedMedia[0].url.split('/').pop()?.split('?')[0]}`}
                                                                style={{ width: '100%', height: '100%', border: 'none' }}
                                                                allowFullScreen
                                                            />
                                                        ) : (
                                                            <video src={selectedMedia[0].url} muted />
                                                        )
                                                    ) : (
                                                        <img src={selectedMedia[0]?.url} alt="" />
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <footer>
                                        <div className="footer-meta">
                                            <b>{destinationUrl.replace('https://', '').split('/')[0]}</b>
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

                    <div className="ai-tip">
                        <span className="ai-icon">✨</span>
                        <p>Hemos optimizado el diseño para {variant}. Puedes editar textos y elementos para que se adapten a tu marca.</p>
                    </div>
                </aside>
            </div>

            <div className="publish-footer">
                <button className="program-btn">📅 Programar</button>
                <button className="publish-now-btn" onClick={onPublish}>🚀 Publicar ahora</button>
            </div>

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
          align-items: center;
          justify-content: center;
          padding: 40px;
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
           margin: auto;
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

        /* FB MOSAIC GRID */
        .fb-grid { background: white !important; }
        .fb-grid-item { position: relative; overflow: hidden; border: 1px solid white; }
        .fb-grid-item img, .fb-grid-item video { width: 100%; height: 100%; object-fit: cover; display: block; }
        
        .fb-grid-2 { display: grid; grid-template-columns: 1fr 1fr; height: 300px; }
        
        .fb-grid-3 { display: flex; height: 350px; }
        .fb-grid-3 .main { flex: 2; height: 100%; }
        .fb-grid-3 .fb-grid-sub { flex: 1; display: flex; flex-direction: column; height: 100%; }
        
        .fb-grid-multi, .fb-grid-mosaic { display: flex; flex-direction: column; min-height: 400px; }
        .fb-grid-top { display: grid; grid-template-columns: 1fr 1fr; height: 250px; }
        .fb-grid-bottom { display: grid; grid-template-columns: 1fr 1fr 1fr; height: 150px; }
        
        .fb-grid-main { height: 250px; border-bottom: 2px solid white; }
        .fb-grid-main img, .fb-grid-main video { width: 100%; height: 100%; object-fit: cover; }
        .fb-grid-row-3 { display: grid; grid-template-columns: repeat(3, 1fr); height: 150px; }
        
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

        .publish-footer {
          height: 80px;
          background: white;
          border-top: 1px solid rgba(0,0,0,0.05);
          display: flex;
          align-items: center;
          justify-content: flex-end;
          padding: 0 40px;
          gap: 16px;
        }

        .program-btn { font-weight: 600; font-size: 0.9rem; opacity: 0.7; padding: 12px 24px; border: 1px solid #eee; border-radius: 30px; }
        .publish-now-btn { background: #b08d6d; color: white; border: none; padding: 12px 32px; border-radius: 30px; font-weight: 700; font-size: 0.9rem; box-shadow: 0 10px 20px rgba(176, 141, 109, 0.2); transition: all 0.2s; }
        .publish-now-btn:hover { background: #9a7b5d; transform: translateY(-2px); box-shadow: 0 12px 24px rgba(176, 141, 109, 0.3); }

        @media (max-width: 1200px) {
           .variant-sidebar { display: none; }
        }
      `}</style>
        </div>
    );
}
