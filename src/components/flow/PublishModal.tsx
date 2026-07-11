"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { ScrapedData, Platform } from "./UnifiedFlow";

type Props = {
    data: ScrapedData;
    platform: Platform;
    onClose: () => void;
    onSuccess: (id: string, url: string) => void;
};

export default function PublishModal({ data, platform, onClose, onSuccess }: Props) {
    const [mounted, setMounted] = useState(false);
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Selection state
    const [selectedProfile, setSelectedProfile] = useState("");
    const [publishType, setPublishType] = useState<"organic" | "paid">("organic");
    const [organicDestination, setOrganicDestination] = useState("");
    const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
    const [youtubeFormat, setYoutubeFormat] = useState<"video" | "shorts">("video");

    // Paid config
    const [budget, setBudget] = useState("10");
    const [duration, setDuration] = useState("7");

    const [accounts, setAccounts] = useState<any[]>([]);
    const syncPopupRef = useRef<Window | null>(null);
    const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const fetchAccounts = useCallback(async () => {
        try {
            const res = await fetch("/api/social/accounts");
            if (res.ok) {
                const data = await res.json();
                return Array.isArray(data) ? data : [];
            }
        } catch { }
        return [];
    }, []);

    useEffect(() => {
        setMounted(true);
        fetchAccounts().then(setAccounts);

        // Auto-set types for platforms with fixed reach
        if (platform === 'youtube') setPublishType('organic');
        if (platform === 'google-ads') setPublishType('paid');

        return () => {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        };
    }, [platform, fetchAccounts]);

    const handleFinalPublish = async () => {
        setLoading(true);
        try {
            // First save the ad (if not already saved, or update it)
            const adSaveRes = await fetch("/api/ads", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: data.title || "Sin título",
                    description: data.description || "",
                    mediaType: data.videos?.length ? "video" : "image",
                    mediaUrl: [
                        ...(data.videos?.map(v => v.url) || []),
                        ...(data.images || [])
                    ].join(","),
                    linkUrl: data.linkUrl || "",
                    hashtags: data.hashtags?.join(" ") || "",
                    firstComment: data.suggestedComment || "",
                    campaignId: "default",
                })
            });

            if (!adSaveRes.ok) {
                const errBody = await adSaveRes.json().catch(() => ({}));
                throw new Error(errBody.error || `Error guardando anuncio (HTTP ${adSaveRes.status})`);
            }
            const ad = await adSaveRes.json();

            // Then publish
            const publishRes = await fetch("/api/publish", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    adId: ad.id,
                    socialAccountId: selectedProfile,
                    destinations: [
                        {
                            platform: platform === "google-ads" ? "youtube" : platform.split("-")[0],
                            destination: publishType === "organic" ? organicDestination : "ads",
                            adsConfig: publishType === "paid" ? {
                                budgetAmount: parseFloat(budget),
                                durationDays: parseInt(duration),
                            } : undefined
                        }
                    ]
                })
            });

            const result = await publishRes.json().catch(() => ({ error: "Respuesta inválida del servidor" }));

            if (publishRes.ok) {
                const postUrl = result.results?.[0]?.postUrl || "";
                onSuccess(ad.id, postUrl);
            } else {
                alert(`Error al publicar: ${result.error || "Error desconocido"}`);
            }
        } catch (err: any) {
            console.error("Publish error:", err);
            alert(`Error al publicar: ${err.message || "Error de conexión"}`);
        } finally {
            setLoading(false);
        }
    };

    const getProviderIcon = (provider: string) => {
        switch (provider) {
            case 'youtube': return '▶️';
            case 'facebook': return '🔵';
            case 'instagram': return '📸';
            default: return '👤';
        }
    };

    const filteredAccounts = accounts.filter(a => {
        if (platform === 'youtube' && a.provider === 'youtube') return true;
        if (platform === 'google-ads' && a.provider === 'youtube') return true;
        if (platform === 'facebook' && a.provider === 'facebook') return true;
        if (platform === 'instagram' && a.provider === 'instagram') return true;
        return platform.includes(a.provider);
    });

    if (!mounted) return null;

    const openSyncPopup = (url: string) => {
        const popup = window.open(url, 'SMMAccountSync', 'width=1000,height=800,scrollbars=yes');
        syncPopupRef.current = popup;

        const initialCount = accounts.length;
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = setInterval(async () => {
            if (syncPopupRef.current && syncPopupRef.current.closed) {
                const fresh = await fetchAccounts();
                setAccounts(fresh);
                if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
                pollIntervalRef.current = null;
                return;
            }
            const fresh = await fetchAccounts();
            if (fresh.length > initialCount) {
                setAccounts(fresh);
                if (syncPopupRef.current && !syncPopupRef.current.closed) syncPopupRef.current.close();
                if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
                pollIntervalRef.current = null;
            }
        }, 2000);
    };

    const handleSyncPopup = (e: React.MouseEvent) => {
        e.preventDefault();
        openSyncPopup('/settings/accounts');
    };

    const handleYoutubeSyncPopup = async (e: React.MouseEvent) => {
        e.preventDefault();
        try {
            // Get the real YouTube OAuth URL with the correct scopes
            const res = await fetch("/api/social/connect?provider=youtube&popup=true");
            if (!res.ok) throw new Error("No se pudo obtener la URL de YouTube");
            const { url } = await res.json();
            if (!url) throw new Error("URL de OAuth no disponible");
            // Open the real Google/YouTube OAuth in popup with polling
            openSyncPopup(url);
        } catch (err: any) {
            alert(`Error al conectar YouTube: ${err.message}`);
        }
    };

    const refreshAccounts = async () => {
        setLoading(true);
        const fresh = await fetchAccounts();
        setAccounts(fresh);
        setLoading(false);
    };

    return createPortal(
        <div className="publish-modal-overlay">
            <div className="modal-card glass-panel">
                <div className="modal-header">
                    <button className="close-btn" onClick={onClose}>✕</button>
                    <div className="stepper">
                        <div className={step >= 1 ? "step active" : "step"}>1</div>
                        <div className={step >= 2 ? "step active" : "step"}>2</div>
                        <div className={step >= 3 ? "step active" : "step"}>3</div>
                    </div>
                </div>

                <div className="modal-body">
                    {step === 1 && (
                        <div className="step-content">
                            <div className="header-with-action">
                                <div className="titles">
                                    <h2 className="step-title">Selecciona tu perfil</h2>
                                    <p className="step-sub">Elige la cuenta desde la que deseas publicar.</p>
                                </div>
                                <button onClick={handleSyncPopup} className="add-profile-btn" title="Conectar nueva cuenta">
                                    <span className="plus">+</span>
                                </button>
                            </div>

                            <div className="account-list">
                                {filteredAccounts.length === 0 ? (
                                    <div className="empty-state">
                                        <div className="empty-icon">🔌</div>
                                        <p>No hay cuentas de {platform} conectadas.</p>
                                        <div className="empty-actions">
                                            <button onClick={handleSyncPopup} className="sync-now-link">Sincronizar ahora</button>
                                            <button onClick={refreshAccounts} className="refresh-mini-btn" title="Actualizar lista">🔄</button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        {filteredAccounts.map(acc => (
                                            <div
                                                key={acc.id}
                                                className={`account-item ${selectedProfile === acc.id ? 'selected' : ''}`}
                                                onClick={() => setSelectedProfile(acc.id)}
                                            >
                                                <div className="acc-avatar">{getProviderIcon(acc.provider)}</div>
                                                <div className="acc-info">
                                                    <b className="acc-name">{acc.accountName || acc.pageName || "Perfil"}</b>
                                                    <span className="acc-provider">{acc.provider} {acc.pageName ? `• ${acc.pageName}` : ''}</span>
                                                </div>
                                                {selectedProfile === acc.id && <div className="selected-check">✓</div>}
                                            </div>
                                        ))}
                                        {/* Quick add option inside the list too */}
                                        <button onClick={handleSyncPopup} className="account-item add-more-item">
                                            <div className="acc-avatar">+</div>
                                            <div className="acc-info">
                                                <b className="acc-name">Conectar otra cuenta</b>
                                                <span className="acc-provider">Abrir sincronizador</span>
                                            </div>
                                        </button>
                                        <button onClick={refreshAccounts} className="refresh-list-btn">
                                            🔄 Actualizar lista de cuentas
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {step === 2 && platform !== 'youtube' && platform !== 'google-ads' && (
                        <div className="step-content">
                            <h2 className="step-title">Tipo de alcance</h2>
                            <p className="step-sub">¿Deseas una publicación orgánica o una campaña de pago?</p>
                            <div className="type-toggle">
                                <button
                                    className={publishType === 'organic' ? 'active' : ''}
                                    onClick={() => setPublishType('organic')}
                                >
                                    <span className="icon">🍃</span>
                                    <div className="label">
                                        <b>Orgánico</b>
                                        <small>Publicación gratuita</small>
                                    </div>
                                </button>
                                <button
                                    className={publishType === 'paid' ? 'active' : ''}
                                    onClick={() => setPublishType('paid')}
                                >
                                    <span className="icon">💰</span>
                                    <div className="label">
                                        <b>ADS (Pago)</b>
                                        <small>Promoción pagada</small>
                                    </div>
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="step-content">
                            {platform === 'youtube' ? (
                                (() => {
                                    const ytAccounts = accounts.filter(a => a.provider === 'youtube');
                                    const toggleChannel = (id: string) => {
                                        setSelectedChannels(prev =>
                                            prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
                                        );
                                    };

                                    if (ytAccounts.length === 0) {
                                        // No channels synced — show CTA to connect
                                        return (
                                            <div className="organic-flow">
                                                <h2 className="step-title">Canal de YouTube</h2>
                                                <div className="yt-no-channels">
                                                    <span className="yt-no-icon">📡</span>
                                                    <p>No tienes ningún canal de YouTube conectado.</p>
                                                    <button className="yt-connect-btn" onClick={handleYoutubeSyncPopup}>
                                                        <span>▶️</span> Conectar canal de YouTube
                                                    </button>
                                                    <button onClick={refreshAccounts} className="refresh-mini-btn" title="Ya conecté, actualizar">🔄 Actualizar</button>
                                                </div>
                                            </div>
                                        );
                                    }

                                    return (
                                        <div className="organic-flow">
                                            <h2 className="step-title">Canal de YouTube</h2>
                                            <p className="step-sub">Selecciona el canal donde publicar. Puedes elegir varios.</p>

                                            {/* Format selector */}
                                            <div className="yt-format-row">
                                                <button
                                                    className={`yt-fmt-btn ${youtubeFormat === 'video' ? 'active' : ''}`}
                                                    onClick={() => setYoutubeFormat('video')}
                                                >
                                                    📺 Video estándar
                                                </button>
                                                <button
                                                    className={`yt-fmt-btn ${youtubeFormat === 'shorts' ? 'active' : ''}`}
                                                    onClick={() => setYoutubeFormat('shorts')}
                                                >
                                                    📱 Shorts
                                                </button>
                                            </div>

                                            {/* Channel list */}
                                            <div className="yt-channel-list">
                                                {ytAccounts.map(acc => (
                                                    <div
                                                        key={acc.id}
                                                        className={`yt-channel-card ${selectedChannels.includes(acc.id) ? 'selected' : ''}`}
                                                        onClick={() => toggleChannel(acc.id)}
                                                    >
                                                        <div className="yt-ch-avatar">▶️</div>
                                                        <div className="yt-ch-info">
                                                            <b>{acc.accountName || acc.pageName || 'Mi canal'}</b>
                                                            <span>{acc.providerAccountId}</span>
                                                        </div>
                                                        {selectedChannels.includes(acc.id) && (
                                                            <div className="selected-check">✓</div>
                                                        )}
                                                    </div>
                                                ))}
                                                <button onClick={handleYoutubeSyncPopup} className="account-item add-more-item" style={{ marginTop: 4 }}>
                                                    <div className="acc-avatar">+</div>
                                                    <div className="acc-info">
                                                        <b className="acc-name">Conectar otro canal</b>
                                                        <span className="acc-provider">Abrir sincronizador YouTube</span>
                                                    </div>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })()
                            ) : publishType === 'organic' ? (
                                <div className="organic-flow">
                                    <h2 className="step-title">Destino de publicación</h2>
                                    <p className="step-sub">¿Dónde quieres publicar?</p>
                                    <div className="destination-grid">
                                        {['feed', 'story', 'reels'].map(d => (
                                            <button
                                                key={d}
                                                className={`dest-card ${organicDestination === d ? 'active' : ''}`}
                                                onClick={() => setOrganicDestination(d)}
                                            >
                                                <span className="dest-icon">{d === 'feed' ? '🖼️' : d === 'story' ? '📱' : '🎬'}</span>
                                                <div className="dest-info">
                                                    <b>{d.charAt(0).toUpperCase() + d.slice(1)}</b>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <h2 className="step-title">Configuración de Campaña</h2>
                                    <p className="step-sub">Tu anuncio se optimizará automáticamente.</p>
                                    <div className="paid-fields">
                                        <div className="field">
                                            <label>Presupuesto diario (€)</label>
                                            <div className="input-with-icon">
                                                <span className="prefix">€</span>
                                                <input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} />
                                            </div>
                                        </div>
                                        <div className="field">
                                            <label>Duración estimada (días)</label>
                                            <div className="input-with-icon">
                                                <input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} />
                                                <span className="suffix">DÍAS</span>
                                            </div>
                                        </div>
                                        <div className="targeting-info">
                                            <span className="info-icon">✨</span>
                                            <p>SMM utilizará segmentación <b>Advantage+</b> e intereses de búsqueda inmobiliaria para maximizar el ROI.</p>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>

                <div className="modal-footer">
                    {step > 1 && (
                        <button
                            className="back-btn"
                            onClick={() => {
                                if (step === 3 && (platform === 'youtube' || platform === 'google-ads')) {
                                    setStep(1);
                                } else {
                                    setStep(step - 1);
                                }
                            }}
                        >
                            ← Anterior
                        </button>
                    )}
                    {step < 3 ? (
                        <button
                            className="next-btn"
                            onClick={() => {
                                if (step === 1 && platform === 'youtube') {
                                    setPublishType('organic');
                                    setStep(3);
                                } else if (step === 1 && platform === 'google-ads') {
                                    setPublishType('paid');
                                    setStep(3);
                                } else {
                                    setStep(step + 1);
                                }
                            }}
                            disabled={step === 1 && !selectedProfile}
                        >
                            Siguiente
                        </button>
                    ) : (
                        <button
                            className="publish-btn"
                            onClick={handleFinalPublish}
                            disabled={loading || !selectedProfile || (platform === 'youtube' && selectedChannels.length === 0)}
                        >
                            {loading ? "Procesando..." : "🚀 Publicar ahora"}
                        </button>
                    )}
                </div>

                <style jsx global>{`
        .publish-modal-overlay {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          width: 100vw !important;
          height: 100vh !important;
          background: rgba(74, 63, 53, 0.4) !important;
          backdrop-filter: blur(16px) !important;
          z-index: 999999999 !important;
          display: flex !important;
          align-items: center;
          justify-content: center;
        }

        .modal-card {
           position: relative !important;
           width: 90% !important;
           max-width: 500px !important;
           background: #ffffff !important;
           border: 1px solid var(--border-color) !important;
           border-radius: 28px !important;
           padding: 32px !important;
           box-shadow: var(--shadow-lg) !important;
           color: var(--text-primary) !important;
           display: flex;
           flex-direction: column;
           gap: 24px;
           z-index: 1000000000 !important;
           animation: modalSlide 0.4s var(--transition-spring);
        }

        @keyframes modalSlide {
            from { transform: translateY(20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }

        .modal-header { display: flex; justify-content: space-between; align-items: center; }
        .close-btn { 
            background: var(--bg-tertiary);
            border: none;
            color: var(--text-muted);
            width: 36px;
            height: 36px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.2s;
        }
        .close-btn:hover { background: var(--bg-primary); color: var(--text-primary); }
        
        .stepper { display: flex; gap: 6px; }
        .step { 
            width: 32px; 
            height: 6px; 
            background: var(--bg-tertiary); 
            border-radius: 3px; 
            font-size: 0;
            transition: all 0.3s;
        }
        .step.active { background: var(--accent-primary); box-shadow: 0 0 10px var(--accent-glow); }

        .header-with-action { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
        .step-title { font-size: 1.75rem; font-weight: 800; margin-bottom: 6px; letter-spacing: -0.02em; color: var(--text-primary); }
        .step-sub { font-size: 0.95rem; color: var(--text-muted); }
        
        .add-profile-btn {
            background: var(--accent-primary);
            color: white;
            width: 32px;
            height: 32px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            font-weight: bold;
            transition: all 0.2s;
        }
        .add-profile-btn:hover { transform: scale(1.1); box-shadow: var(--shadow-glow-gold); }

        .account-list { 
            display: flex; 
            flex-direction: column; 
            gap: 10px; 
            max-height: 320px; 
            overflow-y: auto;
            padding-right: 4px;
            margin-top: 20px;
        }
        .account-list::-webkit-scrollbar { width: 4px; }
        .account-list::-webkit-scrollbar-thumb { background: var(--border-color); border-radius: 10px; }

        .account-item {
          padding: 16px;
          background: #ffffff;
          border: 1.5px solid var(--border-color);
          border-radius: 16px;
          display: flex;
          align-items: center;
          gap: 14px;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
        }
        .account-item:hover { 
            background: var(--bg-primary); 
            border-color: var(--border-hover);
        }
        .account-item.selected { 
            background: var(--bg-primary); 
            border-color: var(--accent-primary);
            box-shadow: 0 4px 20px rgba(176, 141, 109, 0.08);
        }
        
        .add-more-item { border-style: dashed; opacity: 0.7; }
        .add-more-item:hover { opacity: 1; border-style: solid; }

        .acc-avatar { 
            width: 44px; 
            height: 44px; 
            background: var(--bg-tertiary); 
            border-radius: 12px; 
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
        }
        .acc-name { display: block; font-size: 1rem; color: var(--text-primary); }
        .acc-provider { font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
        
        .selected-check {
            margin-left: auto;
            background: var(--accent-primary);
            color: white;
            width: 22px;
            height: 22px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: bold;
        }

        .empty-state {
            padding: 40px 20px;
            text-align: center;
            background: var(--bg-primary);
            border: 1px dashed var(--border-color);
            border-radius: 20px;
        }
        .empty-icon { font-size: 32px; margin-bottom: 12px; opacity: 0.3; }
        .empty-state p { margin-bottom: 8px; font-weight: 600; color: var(--text-primary); }
        .empty-actions { display: flex; align-items: center; justify-content: center; gap: 12px; }
        .refresh-mini-btn { background: none; border: none; font-size: 1.2rem; cursor: pointer; transition: transform 0.3s; }
        .refresh-mini-btn:hover { transform: rotate(180deg); }
        
        .refresh-list-btn { 
            width: 100%; padding: 10px; background: var(--bg-primary); border: 1px dashed var(--border-color); 
            border-radius: 12px; color: var(--text-muted); font-size: 0.8rem; cursor: pointer; transition: all 0.2s;
            margin-top: 4px;
        }
        .refresh-list-btn:hover { background: var(--bg-tertiary); color: var(--text-primary); }

        .sync-now-link { 
            color: var(--accent-primary); 
            background: none;
            border: none;
            font-weight: 700; 
            font-size: 0.9rem;
            text-decoration: underline;
            cursor: pointer;
        }

        .type-toggle { display: flex; gap: 12px; }
        .type-toggle button {
           flex: 1;
           padding: 24px 16px;
           background: #ffffff;
           border: 1.5px solid var(--border-color);
           border-radius: 20px;
           color: var(--text-primary);
           display: flex;
           flex-direction: column;
           align-items: center;
           gap: 10px;
           transition: all 0.3s;
           cursor: pointer;
        }
        .type-toggle button .icon { font-size: 24px; opacity: 0.7; }
        .type-toggle button b { display: block; font-size: 1rem; }
        .type-toggle button small { display: block; font-size: 0.75rem; color: var(--text-muted); font-weight: normal; }
        
        .type-toggle button:hover { background: var(--bg-primary); border-color: var(--border-hover); }
        .type-toggle button.active { 
            background: var(--bg-primary); 
            border-color: var(--accent-primary); 
            box-shadow: 0 4px 20px rgba(176, 141, 109, 0.12);
        }
        .type-toggle button.active .icon { opacity: 1; }

        .options-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .options-grid button {
           padding: 16px;
           background: #ffffff;
           border: 1.5px solid var(--border-color);
           border-radius: 14px;
           color: var(--text-primary);
           font-weight: 600;
           font-size: 0.95rem;
           cursor: pointer;
           transition: all 0.2s;
        }
        .options-grid button:hover { background: var(--bg-primary); }
        .options-grid button.active { background: var(--accent-primary); border-color: var(--accent-primary); color: white; }

        .paid-fields { display: flex; flex-direction: column; gap: 16px; }
        .field label { display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 8px; color: var(--text-secondary); }
        
        .input-with-icon {
            display: flex;
            align-items: center;
            background: #ffffff;
            border: 1.5px solid var(--border-color);
            border-radius: 14px;
            padding: 0 16px;
            transition: all 0.2s;
        }
        .input-with-icon:focus-within {
            border-color: var(--accent-primary);
            background: var(--bg-primary);
        }
        .input-with-icon input {
            flex: 1;
            background: transparent;
            border: none;
            color: var(--text-primary);
            padding: 14px 0;
            font-size: 1.1rem;
            font-weight: 600;
            outline: none;
        }
        .input-with-icon .prefix, .input-with-icon .suffix {
            font-weight: 800;
            font-size: 0.75rem;
            color: var(--accent-primary);
            margin-right: 12px;
        }
        .input-with-icon .suffix { margin-right: 0; margin-left: 12px; opacity: 0.5; color: var(--text-muted); }

        .targeting-info {
            background: rgba(176, 141, 109, 0.05);
            border: 1px solid var(--border-accent);
            padding: 14px;
            border-radius: 12px;
            display: flex;
            gap: 12px;
            font-size: 0.85rem;
            line-height: 1.4;
            color: var(--text-secondary);
        }
        .targeting-info b { color: var(--accent-primary); }

        .modal-footer { 
            display: flex; 
            justify-content: flex-end; 
            align-items: center;
            gap: 16px; 
            padding-top: 10px;
        }
        
        .back-btn { 
            background: none; 
            border: none; 
            color: var(--text-muted); 
            font-weight: 600; 
            cursor: pointer;
            transition: color 0.2s;
        }
        .back-btn:hover { color: var(--text-primary); }

        .next-btn, .publish-btn {
            background: var(--accent-primary);
            color: white;
            border: none;
            padding: 14px 32px;
            border-radius: 30px;
            font-weight: 700;
            font-size: 1rem;
            cursor: pointer;
            transition: all 0.3s;
        }
        .next-btn:disabled, .publish-btn:disabled {
            opacity: 0.4;
            cursor: not-allowed;
            filter: grayscale(1);
        }
        .next-btn:not(:disabled):hover, .publish-btn:not(:disabled):hover {
            transform: translateY(-2px);
            box-shadow: var(--shadow-glow-gold);
            background: var(--accent-hover);
        }

        /* ── YouTube channel picker ── */
        .yt-format-row {
            display: flex; gap: 8px; margin-bottom: 14px;
        }
        .yt-fmt-btn {
            flex: 1; padding: 10px 14px; border-radius: 20px;
            border: 1.5px solid var(--border-color);
            background: #fff; font-size: 0.85rem; font-weight: 600;
            cursor: pointer; transition: all 0.2s; color: var(--text-primary);
        }
        .yt-fmt-btn.active {
            background: var(--accent-primary); color: #fff;
            border-color: var(--accent-primary);
            box-shadow: 0 4px 14px rgba(176,141,109,0.25);
        }
        .yt-channel-list {
            display: flex; flex-direction: column; gap: 8px;
            max-height: 260px; overflow-y: auto;
        }
        .yt-channel-card {
            display: flex; align-items: center; gap: 14px;
            padding: 14px 16px; border-radius: 16px;
            border: 1.5px solid var(--border-color);
            background: #fff; cursor: pointer;
            transition: all 0.2s; position: relative;
        }
        .yt-channel-card:hover { background: var(--bg-primary); border-color: var(--border-hover); }
        .yt-channel-card.selected {
            border-color: #ff0000; background: #fff5f5;
            box-shadow: 0 4px 16px rgba(255,0,0,0.08);
        }
        .yt-ch-avatar {
            width: 44px; height: 44px; background: #fff0f0;
            border-radius: 50%; display: flex; align-items: center;
            justify-content: center; font-size: 20px; flex-shrink: 0;
        }
        .yt-ch-info b { display: block; font-size: 0.95rem; color: var(--text-primary); }
        .yt-ch-info span { font-size: 0.72rem; color: var(--text-muted); }

        /* No channels CTA */
        .yt-no-channels {
            display: flex; flex-direction: column; align-items: center;
            gap: 14px; padding: 32px 20px; margin-top: 12px;
            background: var(--bg-primary); border: 1px dashed var(--border-color);
            border-radius: 20px; text-align: center;
        }
        .yt-no-icon { font-size: 36px; opacity: 0.35; }
        .yt-no-channels p { font-weight: 600; color: var(--text-primary); margin: 0; }
        .yt-connect-btn {
            display: flex; align-items: center; gap: 8px;
            padding: 12px 24px; border-radius: 30px;
            background: #ff0000; color: #fff;
            border: none; font-weight: 700; font-size: 0.95rem;
            cursor: pointer; transition: all 0.2s;
        }
        .yt-connect-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(255,0,0,0.3); }

        /* Dest-card (for non-YT organic) */
        .destination-grid { display: flex; flex-direction: column; gap: 10px; margin-top: 12px; }
        .dest-card {
            display: flex; align-items: center; gap: 14px;
            padding: 16px; border-radius: 16px; border: 1.5px solid var(--border-color);
            background: #fff; cursor: pointer; transition: all 0.2s; text-align: left;
        }
        .dest-card.active { border-color: var(--accent-primary); background: var(--bg-primary); }
        .dest-icon { font-size: 24px; }
        .dest-info b { display: block; font-size: 0.95rem; font-weight: 700; }
        .dest-info span { font-size: 0.75rem; color: var(--text-muted); }
      `}</style>
            </div>
        </div>,
        document.body
    );
}
