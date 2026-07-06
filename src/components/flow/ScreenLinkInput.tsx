"use client";

import { useState } from "react";
import Image from "next/image";

type Props = {
  onScraped: (data: any) => void;
  onManual: () => void;
};

export default function ScreenLinkInput({ onScraped, onManual }: Props) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGo = async () => {
    if (!url.trim() || !url.startsWith("http")) return;

    setLoading(true);
    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (res.ok) {
        const data = await res.json();
        onScraped(data);
      } else {
        alert("No se pudo extraer información del enlace.");
      }
    } catch (error) {
      console.error("Scrape error:", error);
      alert("Error al procesar el enlace.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="link-input-screen">
      <div className="content">
        <div className="header">
          <div className="logo-capsule">
            <div className="logo-wrapper econos-wrapper">
              <Image
                src="/images/logo-econos.png"
                alt="Econos"
                width={120}
                height={26}
                className="logo-econos"
                style={{
                  objectFit: 'contain',
                  width: '100%',
                  height: 'auto',
                  maxHeight: '26px',
                  filter: 'brightness(0.4) sepia(1) hue-rotate(-20deg) saturate(1.5)'
                }}
                priority
                unoptimized
              />
            </div>
            <div className="logo-divider" />
            <div className="logo-wrapper smm-wrapper">
              <Image
                src="/images/logo-smm.png"
                alt="Social Media Manager"
                width={110}
                height={38}
                style={{
                  objectFit: 'contain',
                  width: '100%',
                  height: 'auto',
                  maxHeight: '38px'
                }}
                priority
                unoptimized
              />
            </div>
          </div>
        </div>

        <div className="hero">
          <h1>Publica tu propiedad <br /> <span>en todos los canales</span></h1>
        </div>

        <div className="input-container" style={{ marginTop: "1.5rem" }}>
          <div className="input-wrapper">
            <span className="link-icon">🔗</span>
            <input
              type="text"
              placeholder="Pega la URL del inmueble..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGo()}
            />
            <button className="go-btn" onClick={handleGo} disabled={loading}>
              {loading ? "..." : "GO"}
            </button>
          </div>
        </div>

        <button className="manual-btn" onClick={onManual}>
          ✍️ Publicar sin enlace
        </button>

        <div className="footer-info">
          <p>Compatible con</p>
          <div className="platforms">
            <span>Meta | </span>
            <span>Facebook | </span>
            <span>Instagram | </span>
            <span>Google | </span>
            <span>YouTube | </span>
            <span>Display</span>
          </div>
          <p className="secure">🛡️ Conectado. Seguro. Efectivo.</p>
        </div>
      </div>

      <style jsx>{`
        .link-input-screen {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #f7f3f0; /* Original beige */
          color: #4a3f35; /* Original dark brown */
          font-family: 'Inter', sans-serif;
          padding: 2rem;
          min-height: 80vh;
        }

        .content {
          max-width: 800px;
          width: 100%;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .header {
          margin-bottom: 3rem;
        }

        .logo-capsule {
          display: inline-flex;
          flex-direction: row;
          align-items: center;
          justify-content: center;
          gap: 1.5rem;
          background: rgba(255, 255, 255, 0.6); /* Soft light translucent white */
          backdrop-filter: blur(12px);
          border: 1px solid rgba(74, 63, 53, 0.08); /* Dark brown border at low opacity */
          padding: 0.6rem 1.75rem;
          border-radius: 9999px; /* Rounded pill style */
          box-shadow: 0 4px 20px rgba(74, 63, 53, 0.04), 0 2px 6px rgba(74, 63, 53, 0.02);
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.3s ease, box-shadow 0.3s ease;
        }

        .logo-capsule:hover {
          transform: translateY(-2px);
          border-color: rgba(74, 63, 53, 0.15);
          box-shadow: 0 8px 30px rgba(74, 63, 53, 0.08), 0 4px 12px rgba(74, 63, 53, 0.03);
        }

        .logo-econos {
          filter: brightness(0.4) sepia(1) hue-rotate(-20deg) saturate(1.5);
          transition: filter 0.3s ease;
        }

        .logo-econos:hover {
          filter: brightness(0.35) sepia(1) hue-rotate(-20deg) saturate(1.8);
        }

        .logo-divider {
          width: 1px;
          height: 24px;
          background: #4a3f35;
          opacity: 0.2;
          flex-shrink: 0;
        }

        .logo-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .econos-wrapper {
          width: 120px;
          flex-shrink: 1;
        }

        .smm-wrapper {
          width: 110px;
          flex-shrink: 1;
        }

        @media (max-width: 480px) {
          .logo-capsule {
            gap: 0.75rem;
            padding: 0.4rem 1rem;
            max-width: 90%;
          }
          .econos-wrapper {
            width: 100px;
          }
          .smm-wrapper {
            width: 90px;
          }
          .logo-divider {
            height: 16px;
          }
        }

        .hero h1 {
          font-size: clamp(2rem, 5vw, 3.5rem);
          font-weight: 700;
          line-height: 1.1;
          margin-bottom: 24px;
          color: #4a3f35;
        }

        .hero h1 span {
          color: #b08d6d; /* Golden accent */
        }

        .hero p {
          font-size: 1.1rem;
          opacity: 0.7;
          margin-bottom: 60px;
          max-width: 600px;
        }

        .input-container {
          width: 100%;
          display: flex;
          justify-content: center;
          margin-bottom: 60px;
        }

        .input-wrapper {
          background: white;
          border-radius: 60px;
          padding: 8px 12px 8px 30px;
          display: flex;
          align-items: center;
          width: 100%;
          max-width: 700px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.05);
          transition: transform 0.3s ease;
        }

        .input-wrapper:focus-within {
          transform: translateY(-2px);
          box-shadow: 0 15px 50px rgba(0,0,0,0.08);
        }

        .link-icon {
          font-size: 1.5rem;
          margin-right: 15px;
          opacity: 0.4;
        }

        input {
          border: none;
          outline: none;
          flex: 1;
          font-size: 1.1rem;
          color: #4a3f35;
          background: transparent;
        }

        input::placeholder {
          color: #bcaaa4;
        }

        .go-btn {
          background: #b08d6d;
          color: white;
          border: none;
          width: 70px;
          height: 70px;
          border-radius: 50%;
          font-weight: 700;
          font-size: 1.1rem;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .go-btn:hover {
          background: #9a7b5d;
          transform: scale(1.05);
        }

        .go-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .or-divider {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 20px;
          opacity: 0.4;
          width: 100%;
          max-width: 400px;
        }

        .or-divider::before, .or-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: #4a3f35;
        }

        .or-divider span {
          font-size: 0.85rem;
          font-weight: 600;
          text-transform: uppercase;
        }

        .manual-btn {
          background: transparent;
          border: 2px dashed #b08d6d;
          color: #b08d6d;
          padding: 16px 40px;
          border-radius: 60px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.25s ease;
          margin-bottom: 40px;
        }

        .manual-btn:hover {
          background: #b08d6d;
          color: white;
          transform: translateY(-2px);
        }

        .footer-info {
          margin-top: 40px;
          opacity: 0.6;
        }

        .platforms {
          margin: 10px 0 30px 0;
          font-size: 0.9rem;
          font-weight: 500;
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 0.5rem;
        }

        .secure {
          font-size: 0.8rem;
          font-weight: 500;
        }

        @media (max-width: 768px) {
          .link-input-screen { padding: 1.5rem; }
          .hero h1 { font-size: 2rem; }
          .hero p { font-size: 0.9rem; margin-bottom: 30px; }
          .input-wrapper { padding: 6px 8px 6px 16px; }
          .go-btn { width: 50px; height: 50px; font-size: 0.9rem; }
          .header { margin-bottom: 30px; }
          .manual-btn { padding: 12px 24px; font-size: 0.9rem; }
        }

        @media (max-width: 480px) {
          .hero h1 { font-size: 1.6rem; }
          .hero p { font-size: 0.85rem; margin-bottom: 20px; }
          .input-wrapper { 
            flex-direction: column; 
            border-radius: 16px; 
            padding: 12px; 
            gap: 10px; 
          }
          .go-btn { width: 100%; border-radius: 12px; height: 48px; }
          .link-icon { display: none; }
          input { font-size: 0.95rem; text-align: center; }
          .or-divider { margin: 10px 0; }
        }
      `}</style>
    </div>
  );
}
