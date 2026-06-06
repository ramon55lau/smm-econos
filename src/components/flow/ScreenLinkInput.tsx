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
          <div className="logo-group">
            <span className="econos-text">ECONOS</span>
            <span className="smm-text">SMM</span>
          </div>
        </div>

        <div className="hero">
          <h1>Publica tu propiedad <br /> <span>en todos los canales</span></h1>
          <p>Pega la URL de tu inmueble y creamos las campañas automáticamente para ti.</p>
        </div>

        <div className="input-container">
          <div className="input-wrapper">
            <span className="link-icon">🔗</span>
            <input
              type="text"
              placeholder="Pega la URL del inmueble o producto..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGo()}
            />
            <button className="go-btn" onClick={handleGo} disabled={loading}>
              {loading ? "..." : "GO"}
            </button>
          </div>
        </div>

        <div className="or-divider">
          <span>o</span>
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

        .logo-group {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .econos-text {
          font-weight: 800;
          letter-spacing: 4px;
          font-size: 1.5rem;
          color: #4a3f35;
        }

        .smm-text {
          font-size: 0.9rem;
          opacity: 0.6;
          margin-top: -4px;
          letter-spacing: 2px;
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
