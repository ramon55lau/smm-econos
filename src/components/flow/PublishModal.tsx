"use client";

import { useState, useEffect } from "react";
import { ScrapedData, Platform } from "./UnifiedFlow";

type Props = {
    data: ScrapedData;
    platform: Platform;
    onClose: () => void;
    onSuccess: (id: string) => void;
};

export default function PublishModal({ data, platform, onClose, onSuccess }: Props) {
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
        fetch("/api/social").then(r => r.json()).then(setAccounts).catch(() => { });
    }, []);

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
                    mediaUrl: data.videos?.length ? data.videos[0].url : data.images[0],
                    linkUrl: data.linkUrl,
                    campaignId: "default", // Should handle campaign selection too
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
                            platform: platform.split("-")[0], // e.g. facebook, instagram, youtube
                            destination: publishType === "organic" ? organicDestination : "ads",
                            adsConfig: publishType === "paid" ? {
                                budgetAmount: parseFloat(budget),
                                durationDays: parseInt(duration),
                                // Add more targeting defaults
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

    return (
        <div className="publish-modal-overlay">
            <div className="modal-card">
                <div className="modal-header">
                    <button className="close-btn" onClick={onClose}>✕</button>
                    <div className="stepper">
                        <div className={step >= 1 ? "active" : ""}>1</div>
                        <div className={step >= 2 ? "active" : ""}>2</div>
                        <div className={step >= 3 ? "active" : ""}>3</div>
                    </div>
                </div>

                <div className="modal-body">
                    {step === 1 && (
                        <div className="step-content">
                            <h2>Selecciona tu perfil</h2>
                            <p>Elige la cuenta desde la que deseas publicar.</p>
                            <div className="account-list">
                                {accounts.length === 0 ? (
                                    <p className="no-accounts">No hay cuentas conectadas.</p>
                                ) : (
                                    accounts.filter(a => platform.includes(a.provider)).map(acc => (
                                        <div
                                            key={acc.id}
                                            className={`account-item ${selectedProfile === acc.id ? 'selected' : ''}`}
                                            onClick={() => setSelectedProfile(acc.id)}
                                        >
                                            <div className="acc-avatar"></div>
                                            <div className="acc-info">
                                                <b>{acc.accountName || acc.pageName || "Perfil"}</b>
                                                <span>{acc.provider}</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="step-content">
                            <h2>Tipo de alcance</h2>
                            <p>¿Deseas una publicación orgánica o una campaña de pago?</p>
                            <div className="type-toggle">
                                <button
                                    className={publishType === 'organic' ? 'active' : ''}
                                    onClick={() => setPublishType('organic')}
                                >
                                    🍃 Orgánico
                                </button>
                                <button
                                    className={publishType === 'paid' ? 'active' : ''}
                                    onClick={() => setPublishType('paid')}
                                >
                                    💰 ADS (Pago)
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="step-content">
                            {publishType === 'organic' ? (
                                <>
                                    <h2>Destino orgánico</h2>
                                    <p>¿Dónde quieres que aparezca tu publicación?</p>
                                    <div className="options-grid">
                                        {["Reels", "Fanpage", "Muro", "Canal"].map(opt => (
                                            <button
                                                key={opt}
                                                className={organicDestination === opt.toLowerCase() ? 'active' : ''}
                                                onClick={() => setOrganicDestination(opt.toLowerCase())}
                                            >
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <>
                                    <h2>Detalles de segmentación</h2>
                                    <p>Configura el presupuesto y duración de tu anuncio.</p>
                                    <div className="paid-fields">
                                        <div className="field">
                                            <label>Presupuesto diario ($)</label>
                                            <input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} />
                                        </div>
                                        <div className="field">
                                            <label>Duración (días)</label>
                                            <input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} />
                                        </div>
                                        <p className="targeting-note">La segmentación se ha pre-configurado de forma óptima para tu sector.</p>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>

                <div className="modal-footer">
                    {step > 1 && <button className="back-btn" onClick={() => setStep(step - 1)}>Anterior</button>}
                    {step < 3 ? (
                        <button className="next-btn" onClick={() => setStep(step + 1)}>Siguiente</button>
                    ) : (
                        <button className="publish-btn" onClick={handleFinalPublish} disabled={loading}>
                            {loading ? "Publicando..." : "🚀 Publicar ahora"}
                        </button>
                    )}
                </div>
            </div>

            <style jsx>{`
        .publish-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.4);
          backdrop-filter: blur(8px);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: fadeIn 0.3s ease-out;
        }

        .modal-card {
          background: white;
          width: 100%;
          max-width: 500px;
          border-radius: 30px;
          box-shadow: 0 30px 60px rgba(0,0,0,0.1);
          padding: 30px;
          display: flex;
          flex-direction: column;
          gap: 30px;
        }

        .modal-header { display: flex; justify-content: space-between; align-items: center; }
        .close-btn { font-size: 1.2rem; opacity: 0.3; }
        
        .stepper { display: flex; gap: 8px; }
        .stepper div { width: 30px; height: 6px; background: #eee; border-radius: 3px; }
        .stepper div.active { background: #b08d6d; }

        .step-content h2 { font-size: 1.6rem; margin-bottom: 8px; }
        .step-content p { font-size: 0.9rem; opacity: 0.5; margin-bottom: 30px; }

        .account-list { display: flex; flex-direction: column; gap: 12px; }
        .account-item {
          padding: 16px;
          border: 2px solid #f5f5f5;
          border-radius: 16px;
          display: flex;
          align-items: center;
          gap: 16px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .account-item:hover { border-color: #eee; }
        .account-item.selected { border-color: #b08d6d; background: #fffdfb; }
        .acc-avatar { width: 40px; height: 40px; background: #eee; border-radius: 50%; }
        .acc-info b { display: block; font-size: 0.95rem; }
        .acc-info span { font-size: 0.75rem; opacity: 0.4; text-transform: uppercase; }

        .type-toggle { display: flex; gap: 12px; }
        .type-toggle button {
           flex: 1;
           padding: 40px 20px;
           border: 2px solid #f5f5f5;
           border-radius: 20px;
           font-weight: 700;
           font-size: 1rem;
           transition: all 0.2s;
        }
        .type-toggle button.active { border-color: #b08d6d; background: #fffdfb; color: #b08d6d; }

        .options-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .options-grid button {
           padding: 20px;
           border: 2px solid #f5f5f5;
           border-radius: 16px;
           font-weight: 600;
        }
        .options-grid button.active { border-color: #b08d6d; background: #fffdfb; }

        .paid-fields { display: flex; flex-direction: column; gap: 20px; }
        .field label { display: block; font-size: 0.8rem; font-weight: 600; margin-bottom: 8px; opacity: 0.6; }
        .field input { width: 100%; padding: 12px 16px; border: 1px solid #eee; border-radius: 12px; font-size: 1rem; outline: none; }
        .targeting-note { font-size: 0.75rem; font-style: italic; opacity: 0.4; text-align: center; margin-top: 10px; }

        .modal-footer { display: flex; justify-content: flex-end; gap: 16px; padding-top: 20px; border-top: 1px solid #f5f5f5; }
        .back-btn { font-weight: 600; opacity: 0.5; }
        .next-btn, .publish-btn {
           background: #b08d6d;
           color: white;
           padding: 12px 32px;
           border-radius: 30px;
           font-weight: 700;
        }
        .publish-btn { background: #b08d6d; box-shadow: 0 10px 20px rgba(176, 141, 109, 0.2); }
      `}</style>
        </div>
    );
}
