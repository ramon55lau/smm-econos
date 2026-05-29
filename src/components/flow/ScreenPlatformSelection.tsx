"use client";

import { ScrapedData, Platform } from "./UnifiedFlow";

type Props = {
  data: ScrapedData;
  onSelect: (platform: Platform) => void;
  onBack: () => void;
};

export default function ScreenPlatformSelection({ data, onSelect, onBack }: Props) {
  return (
    <div className="platform-selection-screen">
      <div className="top-bar">
        <div className="url-preview">
          <span className="link-icon">🔗</span>
          <span className="current-url">{data.linkUrl}</span>
          <button className="go-btn" onClick={onBack}>CAMBIAR</button>
        </div>
      </div>

      <div className="content">
        <div className="header-text">
          <h2 className="title">¿Dónde quieres publicar?</h2>
          <p className="subtitle">Selecciona la red social para tu anuncio y el I.A. optimizará tu contenido.</p>
        </div>

        <div className="selection-grid">
          {/* META SECTION */}
          <div className="platform-group">
            <div className="group-label">
              <div className="label-line"></div>
              <span>CONECTADO CON META</span>
              <div className="label-line"></div>
            </div>
            <div className="cards-row">
              <div className="plat-card facebook" onClick={() => onSelect('facebook')}>
                <div className="card-icon-wrapper fb">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/b/b8/2021_Facebook_icon.svg" alt="Facebook" />
                </div>
                <div className="card-info">
                  <h3>Facebook</h3>
                  <p>Muro, Stories y Reels</p>
                </div>
                <div className="arrow">→</div>
              </div>

              <div className="plat-card instagram" onClick={() => onSelect('instagram')}>
                <div className="card-icon-wrapper ig">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/e/e1/Instagram_logo_2016.svg" alt="Instagram" />
                </div>
                <div className="card-info">
                  <h3>Instagram</h3>
                  <p>Feed, Stories y Reels</p>
                </div>
                <div className="arrow">→</div>
              </div>
            </div>
          </div>

          {/* GOOGLE SECTION */}
          <div className="platform-group">
            <div className="group-label">
              <div className="label-line"></div>
              <span>CONECTADO CON GOOGLE</span>
              <div className="label-line"></div>
            </div>
            <div className="cards-row">
              <div className="plat-card google-ads" onClick={() => onSelect('google-ads')}>
                <div className="card-icon-wrapper gads">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/c/c7/Google_Ads_logo.svg" alt="Google Ads" />
                </div>
                <div className="card-info">
                  <h3>Google Ads</h3>
                  <p>Búsqueda y Display</p>
                </div>
                <div className="arrow">→</div>
              </div>

              <div className="plat-card youtube" onClick={() => onSelect('youtube')}>
                <div className="card-icon-wrapper yt">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/0/09/YouTube_full-color_icon_%282017%29.svg" alt="YouTube" />
                </div>
                <div className="card-info">
                  <h3>YouTube</h3>
                  <p>Anuncios y Shorts</p>
                </div>
                <div className="arrow">→</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bottom-actions">
        <button className="back-link" onClick={onBack}>
          <span className="arrow">←</span> Volver a editar enlace
        </button>
      </div>

      <style jsx>{`
        .platform-selection-screen {
          flex: 1;
          display: flex;
          flex-direction: column;
          background-color: #f7f3f0;
          color: #2c241e;
          min-height: 100vh;
          padding-bottom: 60px;
        }

        .top-bar {
          padding: 24px;
          width: 100%;
          display: flex;
          justify-content: center;
        }

        .url-preview {
          background: white;
          border-radius: 40px;
          padding: 6px 6px 6px 20px;
          display: flex;
          align-items: center;
          width: 100%;
          max-width: 580px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.04);
          border: 1px solid rgba(0,0,0,0.02);
        }

        .current-url {
          flex: 1;
          font-size: 0.9rem;
          margin: 0 12px;
          color: #4a3f35;
          opacity: 0.6;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .url-preview .go-btn {
          background: #b08d6d;
          color: white;
          border: none;
          padding: 10px 24px;
          border-radius: 20px;
          font-weight: 700;
          font-size: 0.85rem;
          cursor: pointer;
        }

        .content {
          flex: 1;
          max-width: 900px;
          width: 100%;
          margin: 0 auto;
          padding: 40px 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .header-text {
            text-align: center;
            margin-bottom: 60px;
        }

        .title {
          font-size: 2.8rem;
          font-weight: 800;
          margin-bottom: 12px;
          letter-spacing: -0.02em;
        }

        .subtitle {
          font-size: 1.1rem;
          color: #4a3f35;
          opacity: 0.6;
        }

        .selection-grid {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 60px;
        }

        .platform-group {
           width: 100%;
        }

        .group-label {
           display: flex;
           align-items: center;
           gap: 20px;
           margin-bottom: 30px;
        }

        .group-label span {
           font-size: 0.75rem;
           font-weight: 800;
           letter-spacing: 0.1em;
           color: #b08d6d;
           white-space: nowrap;
        }

        .label-line {
           flex: 1;
           height: 1px;
           background: rgba(176, 141, 109, 0.2);
        }

        .cards-row {
           display: grid;
           grid-template-columns: 1fr 1fr;
           gap: 20px;
        }

        .plat-card {
           background: white;
           border-radius: 24px;
           padding: 24px;
           display: flex;
           align-items: center;
           gap: 20px;
           cursor: pointer;
           transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
           border: 1px solid rgba(0,0,0,0.03);
           box-shadow: 0 4px 20px rgba(0,0,0,0.02);
           position: relative;
           overflow: hidden;
        }

        .plat-card:hover {
           transform: translateY(-5px);
           box-shadow: 0 20px 40px rgba(176, 141, 109, 0.12);
           border-color: rgba(176, 141, 109, 0.3);
        }

        .plat-card:hover .arrow {
           transform: translateX(5px);
           opacity: 1;
        }

        .card-icon-wrapper {
           width: 64px;
           height: 64px;
           background: #fbf9f7;
           border-radius: 18px;
           display: flex;
           align-items: center;
           justify-content: center;
           padding: 14px;
        }

        .card-icon-wrapper img {
           width: 100%;
           height: 100%;
           object-fit: contain;
        }

        .card-info h3 {
           font-size: 1.25rem;
           font-weight: 700;
           margin-bottom: 4px;
        }

        .card-info p {
           font-size: 0.85rem;
           opacity: 0.5;
           font-weight: 500;
        }

        .arrow {
           margin-left: auto;
           font-size: 1.2rem;
           opacity: 0.2;
           transition: all 0.3s;
           font-weight: 700;
           color: #b08d6d;
        }

        .bottom-actions {
          padding: 40px;
          text-align: center;
        }

        .back-link {
          background: none;
          border: none;
          font-size: 0.9rem;
          font-weight: 600;
          color: #4a3f35;
          opacity: 0.4;
          cursor: pointer;
          transition: opacity 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .back-link:hover {
          opacity: 1;
        }

        @media (max-width: 768px) {
           .cards-row { grid-template-columns: 1fr; }
           .title { font-size: 2rem; }
           .content { padding: 20px; }
        }
      `}</style>
    </div>
  );
}
