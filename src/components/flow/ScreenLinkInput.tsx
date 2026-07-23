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
        <div className="hero" style={{ marginTop: "1rem" }}>
          <h1>Publica tu propiedad <br /> <span>en todos los canales</span></h1>
        </div>

        <div className="input-container" style={{ marginTop: "1.5rem" }}>
          <div className="input-wrapper">
            <span className="link-icon">🔗</span>
            <input
              type="text"
              placeholder="Pega la URL del inmueble o producto"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGo()}
            />
            <button className="go-btn" onClick={handleGo} disabled={loading}>
              {loading ? "..." : (<>GO <span style={{ marginLeft: 4 }}>→</span></>)}
            </button>
          </div>
        </div>

        <button className="manual-btn" onClick={onManual}>
          <svg className="wand-icon" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7.5 5.6L5 7l1.4-2.5L5 2l2.5 1.4L10 2 8.6 4.5 10 7 7.5 5.6zm12 9.8L17 14l-1.4 2.5L17 19l2.5-1.4L22 19l-1.4-2.5L22 14l-2.5 1.4zM22 2l-2.5 1.4L17 2l1.4 2.5L17 7l2.5-1.4L22 7l-1.4-2.5L22 2zM14.37 7.29a1.002 1.002 0 0 0-1.41 0L2.29 17.96a1.002 1.002 0 0 0 0 1.41l2.34 2.34c.39.39 1.02.39 1.41 0L16.71 11.04a1.002 1.002 0 0 0 0-1.41l-2.34-2.34zm-9.33 11.6L3.7 17.55l8.66-8.66 1.34 1.34-8.66 8.66z"/>
          </svg>
          <span>Publicar sin enlace</span>
        </button>

        <div className="footer-info">
          <p>Compatible con</p>
          <div className="platform-icons">
            {/* Meta */}
            <span className="platform-icon" title="Meta">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16.5 6C14.7 6 13.1 6.9 12 8.3C10.9 6.9 9.3 6 7.5 6C4.5 6 2 8.5 2 12C2 15.5 4.5 18 7.5 18C9.3 18 10.9 17.1 12 15.7C13.1 17.1 14.7 18 16.5 18C19.5 18 22 15.5 22 12C22 8.5 19.5 6 16.5 6ZM7.5 16C5.6 16 4 14.2 4 12C4 9.8 5.6 8 7.5 8C8.9 8 10.2 8.8 11 10.1C10.3 11.8 9.1 13.8 7.5 16ZM16.5 16C14.9 16 13.7 14 13 12.3C13.8 11 15.1 10.2 16.5 10.2C18.4 10.2 20 12 20 14.2C20 16.4 18.4 16 16.5 16Z" />
              </svg>
            </span>
            {/* Facebook */}
            <span className="platform-icon" title="Facebook">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h7v-7h-2v-3h2V9.5C9.5 7.57 10.68 6.5 12.42 6.5c.83 0 1.55.06 1.76.09v2.04h-1.21c-.93 0-1.11.44-1.11 1.09V11h2.25l-.3 3h-1.95V21h4a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z"/>
              </svg>
            </span>
            {/* Instagram */}
            <span className="platform-icon" title="Instagram">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
              </svg>
            </span>
            {/* Google */}
            <span className="platform-icon" title="Google">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.545 10.239v3.821h5.445c-0.712 2.315-2.647 3.972-5.445 3.972-3.332 0-6.033-2.701-6.033-6.032s2.701-6.032 6.033-6.032c1.498 0 2.866 0.549 3.921 1.453l2.814-2.814c-1.79-1.677-4.184-2.702-6.735-2.702-5.522 0-10 4.478-10 10s4.478 10 10 10c8.396 0 10.249-7.85 9.426-11.721h-9.426z"/>
              </svg>
            </span>
            {/* YouTube */}
            <span className="platform-icon" title="YouTube">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </span>
            {/* Google Ads */}
            <span className="platform-icon" title="Google Ads">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M4.5 16.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
                <path d="M8.2 19.5l7.6-13.2c.4-.7 1.3-.9 2-.5l.8.5c.7.4.9 1.3.5 2L11.5 21.5a1.8 1.8 0 0 1-2.5.6l-.8-.5a1.76 1.76 0 0 1-.5-2.1z"/>
                <path d="M19.1 19.5L14.7 12a1.8 1.8 0 0 0-2.5-.6l-.8.5a1.76 1.76 0 0 0-.5 2.1l4.4 7.5c.4.7 1.3.9 2 .5l.8-.5a1.8 1.8 0 0 0 1-2z"/>
              </svg>
            </span>
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
          background-color: #FAFAFA;
          color: #071322;
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
          background: rgba(255, 255, 255, 0.6);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(7, 19, 34, 0.08);
          padding: 0.6rem 1.75rem;
          border-radius: 9999px;
          box-shadow: 0 4px 20px rgba(7, 19, 34, 0.04), 0 2px 6px rgba(7, 19, 34, 0.02);
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.3s ease, box-shadow 0.3s ease;
        }

        .logo-capsule:hover {
          transform: translateY(-2px);
          border-color: rgba(7, 19, 34, 0.15);
          box-shadow: 0 8px 30px rgba(7, 19, 34, 0.08), 0 4px 12px rgba(7, 19, 34, 0.03);
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
          background: #071322;
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
          color: #071322;
        }

        .hero h1 span {
          background: linear-gradient(90deg, #3aa79d 0%, #5478bd 20%, #9955bb 40%, #d855a4 65%, #e95977 85%, #f27244 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          display: inline-block;
        }

        .hero p {
          font-size: 1.1rem;
          color: #8C959B;
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
          box-shadow: 0 10px 40px rgba(7, 19, 34, 0.05);
          transition: transform 0.3s ease;
        }

        .input-wrapper:focus-within {
          transform: translateY(-2px);
          box-shadow: 0 15px 50px rgba(7, 19, 34, 0.08);
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
          color: #071322;
          background: transparent;
        }

        input::placeholder {
          color: #8C959B;
        }

        .go-btn {
          background: #6B8C84;
          color: #FFFFFF;
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
          background: #5A7A72;
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
          background: #071322;
        }

        .or-divider span {
          font-size: 0.85rem;
          font-weight: 600;
          text-transform: uppercase;
        }

        .manual-btn {
          background: transparent;
          border: none;
          color: #071322;
          padding: 8px 16px;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.25s ease;
          margin-bottom: 40px;
          display: inline-flex;
          align-items: center;
          gap: 10px;
        }

        .wand-icon {
          color: #6B8C84;
          flex-shrink: 0;
        }

        .manual-btn span {
          border-bottom: 1.5px dotted #6B8C84;
          padding-bottom: 2px;
        }

        .manual-btn:hover {
          color: #6B8C84;
          transform: translateY(-1px);
        }

        .footer-info {
          margin-top: 40px;
          color: #8C959B;
        }

        .platform-icons {
          margin: 16px 0 30px 0;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1.5rem;
        }

        .platform-icon {
          color: #8C959B;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.2s ease, transform 0.2s ease;
          cursor: default;
        }

        .platform-icon:hover {
          color: #071322;
          transform: translateY(-2px);
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

