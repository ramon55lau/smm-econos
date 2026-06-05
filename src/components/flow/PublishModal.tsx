"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { ScrapedData, Platform } from "./UnifiedFlow";

type Props = {
    data: ScrapedData;
    platform: Platform;
    onClose: () => void;
    onSuccess: (id: string) => void;
};

export default function PublishModal({ data, platform, onClose, onSuccess }: Props) {
    const [mounted, setMounted] = useState(false);
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Selection state
    const [selectedProfile, setSelectedProfile] = useState("");
    const [publishType, setPublishType] = useState<"organic" | "paid">("organic");
    const [organicDestination, setOrganicDestination] = useState("");

    // Paid config
    const [budget, setBudget] = useState("10");
    const [duration, setDuration] = useState("7");

    const [accounts, setAccounts] = useState<any[]>([]);

    useEffect(() => {
        setMounted(true);
        fetch("/api/social/accounts").then(r => r.json()).then(setAccounts).catch(() => { });

        // Auto-set types for platforms with fixed reach
        if (platform === 'youtube') setPublishType('organic');
        if (platform === 'google-ads') setPublishType('paid');
        console.log("PublishModal Effect: platform =", platform, "mounted = true");
    }, [platform]);

    const handleFinalPublish = async () => {
        setLoading(true);
        try {
            // First save the ad (if not already saved, or update it)
            const adSaveRes = await fetch("/api/ads", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: data.title,
                    description: data.description,
                    mediaType: data.videos?.length ? "video" : "image",
                    mediaUrl: data.videos?.length ? data.videos[0].url : (data.images?.length ? data.images[0] : ""),
                    linkUrl: data.linkUrl,
                    campaignId: "default",
                })
            });

            if (!adSaveRes.ok) throw new Error("Error saving ad");
            const ad = await adSaveRes.json();

            // Then publish
            const publishRes = await fetch("/api/publish", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    adId: ad.id,
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

            if (publishRes.ok) {
                onSuccess(ad.id);
            } else {
                const error = await publishRes.json();
                alert(`Error al publicar: ${error.error || "Error desconocido"}`);
            }
        } catch (err) {
            console.error(err);
            alert("Error de conexión al publicar.");
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

    return (
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
                                <a href="/settings/accounts" className="add-profile-btn" title="Conectar nueva cuenta">
                                    <span className="plus">+</span>
                                </a>
                            </div>

                            <div className="account-list">
                                {filteredAccounts.length === 0 ? (
                                    <div className="empty-state">
                                        <div className="empty-icon">🔌</div>
                                        <p>No hay cuentas de {platform} conectadas.</p>
                                        <a href="/settings/accounts" className="sync-now-link">Sincronizar ahora</a>
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
                                        <a href="/settings/accounts" className="account-item add-more-item">
                                            <div className="acc-avatar">+</div>
                                            <div className="acc-info">
                                                <b className="acc-name">Conectar otra cuenta</b>
                                                <span className="acc-provider">Ir a configuraciones</span>
                                            </div>
                                        </a>
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
                            {publishType === 'organic' || platform === 'youtube' ? (
                                <div className="organic-flow">
                                    <h2 className="step-title">Destino en YouTube</h2>
                                    <p className="step-sub">¿Dónde quieres publicar este video?</p>
                                    <div className="destination-grid">
                                        <button
                                            className={`dest-card ${organicDestination === 'shorts' ? 'active' : ''}`}
                                            onClick={() => setOrganicDestination('shorts')}
                                        >
                                            <span className="dest-icon">📱</span>
                                            <div className="dest-info">
                                                <b>YouTube Shorts</b>
                                                <span>Video vertical corto</span>
                                            </div>
                                        </button>
                                        <button
                                            className={`dest-card ${organicDestination === 'canal' ? 'active' : ''}`}
                                            onClick={() => setOrganicDestination('canal')}
                                        >
                                            <span className="dest-icon">📺</span>
                                            <div className="dest-info">
                                                <b>Canal Principal</b>
                                                <span>Video estándar</span>
                                            </div>
                                        </button>
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
                            disabled={loading || !selectedProfile}
                        >
                            {loading ? "Procesando..." : "🚀 Publicar ahora"}
                        </button>
                    )}
                </div>

                <style jsx>{`
        .publish-modal-overlay {
          position: fixed !important;
          top: 0;
          left: 0;
          width: 100vw !important;
          height: 100vh !important;
          background: rgba(0,0,0,0.85);
          backdrop-filter: blur(10px);
          z-index: 9999999;
          display: block;
        }

        .modal-card {
           position: fixed !important;
           top: 50vh !important;
           left: 50vw !important;
           transform: translate(-50%, -50%) !important;
           width: 90% !important;
           max-width: 500px !important;
           background: #211d19;
           border: 1px solid var(--glass-border);
           border-radius: 28px;
           padding: 32px;
           box-shadow: 0 20px 40px rgba(0,0,0,0.5);
           color: white;
           display: flex;
           flex-direction: column;
           gap: 24px;
           animation: modalSlide 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes modalSlide {
            from { transform: translateY(20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }

        .modal-header { display: flex; justify-content: space-between; align-items: center; }
        .close-btn { 
            background: rgba(255,255,255,0.05);
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
        .close-btn:hover { background: rgba(255,255,255,0.1); color: var(--text-primary); }
        
        .stepper { display: flex; gap: 6px; }
        .step { 
            width: 32px; 
            height: 6px; 
            background: rgba(255,255,255,0.08); 
            border-radius: 3px; 
            font-size: 0;
            transition: all 0.3s;
        }
        .step.active { background: var(--accent-primary); box-shadow: 0 0 10px var(--accent-glow); }

        .header-with-action { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
        .step-title { font-size: 1.75rem; font-weight: 800; margin-bottom: 6px; letter-spacing: -0.02em; }
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
        .add-profile-btn:hover { transform: scale(1.1); box-shadow: var(--shadow-glow-red); }

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
        .account-list::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }

        .account-item {
          padding: 16px;
          background: rgba(255,255,255,0.03);
          border: 1.5px solid rgba(255,255,255,0.05);
          border-radius: 16px;
          display: flex;
          align-items: center;
          gap: 14px;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
        }
        .account-item:hover { 
            background: rgba(255,255,255,0.06); 
            border-color: rgba(255,255,255,0.1);
        }
        .account-item.selected { 
            background: var(--selection-bg); 
            border-color: var(--accent-primary);
            box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        }
        
        .add-more-item { border-style: dashed; opacity: 0.7; }
        .add-more-item:hover { opacity: 1; border-style: solid; }

        .acc-avatar { 
            width: 44px; 
            height: 44px; 
            background: rgba(255,255,255,0.05); 
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
            background: rgba(255,255,255,0.02);
            border: 1px dashed rgba(255,255,255,0.1);
            border-radius: 20px;
        }
        .empty-icon { font-size: 32px; margin-bottom: 12px; opacity: 0.3; }
        .empty-state p { margin-bottom: 8px; font-weight: 600; }
        .sync-now-link { 
            color: var(--accent-primary); 
            font-weight: 700; 
            font-size: 0.9rem;
            text-decoration: underline;
        }

        .type-toggle { display: flex; gap: 12px; }
        .type-toggle button {
           flex: 1;
           padding: 24px 16px;
           background: rgba(255,255,255,0.03);
           border: 1.5px solid rgba(255,255,255,0.05);
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
        
        .type-toggle button:hover { background: rgba(255,255,255,0.06); }
        .type-toggle button.active { 
            background: var(--selection-bg); 
            border-color: var(--accent-primary); 
            box-shadow: var(--shadow-glow-red);
        }
        .type-toggle button.active .icon { opacity: 1; }

        .options-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .options-grid button {
           padding: 16px;
           background: rgba(255,255,255,0.03);
           border: 1.5px solid rgba(255,255,255,0.05);
           border-radius: 14px;
           color: var(--text-primary);
           font-weight: 600;
           font-size: 0.95rem;
           cursor: pointer;
           transition: all 0.2s;
        }
        .options-grid button:hover { background: rgba(255,255,255,0.06); }
        .options-grid button.active { background: var(--accent-primary); border-color: var(--accent-primary); }

        .paid-fields { display: flex; flex-direction: column; gap: 16px; }
        .field label { display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 8px; color: var(--text-secondary); }
        
        .input-with-icon {
            display: flex;
            align-items: center;
            background: rgba(255,255,255,0.04);
            border: 1.5px solid rgba(255,255,255,0.06);
            border-radius: 14px;
            padding: 0 16px;
            transition: all 0.2s;
        }
        .input-with-icon:focus-within {
            border-color: var(--accent-primary);
            background: rgba(255,255,255,0.06);
        }
        .input-with-icon input {
            flex: 1;
            background: transparent;
            border: none;
            color: white;
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
        .input-with-icon .suffix { margin-right: 0; margin-left: 12px; opacity: 0.5; color: white; }

        .targeting-info {
            background: rgba(196, 26, 26, 0.05);
            border: 1px solid rgba(196, 26, 26, 0.15);
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
            box-shadow: var(--shadow-glow-red);
            background: var(--accent-hover);
        }
      `}</style>
            </div>
        </div>
    );
}
