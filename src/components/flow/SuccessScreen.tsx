"use client";

import Link from "next/link";

type Props = {
    adId: string;
    onReset: () => void;
};

export default function SuccessScreen({ adId, onReset }: Props) {
    return (
        <div className="success-screen">
            <div className="content">
                <div className="icon">✅</div>
                <h1>¡Publicado con éxito!</h1>
                <p>Tu anuncio ha sido enviado a la red social y estará activo en breve.</p>

                <div className="actions">
                    <Link href={`/ads`} className="view-link">Ver mis anuncios</Link>
                    <button className="new-btn" onClick={onReset}>Crear otro anuncio</button>
                </div>
            </div>

            <style jsx>{`
        .success-screen {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #f7f3f0;
          text-align: center;
        }

        .content {
          max-width: 500px;
          animation: slideUp 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }

        .icon {
          font-size: 5rem;
          margin-bottom: 24px;
        }

        h1 {
          font-size: 2.4rem;
          font-weight: 700;
          margin-bottom: 12px;
          color: #4a3f35;
        }

        p {
          font-size: 1.1rem;
          opacity: 0.6;
          margin-bottom: 40px;
          line-height: 1.5;
        }

        .actions {
          display: flex;
          flex-direction: column;
          gap: 16px;
          align-items: center;
        }

        .view-link {
          background: #b08d6d;
          color: white;
          padding: 14px 40px;
          border-radius: 30px;
          font-weight: 700;
          font-size: 1rem;
          text-decoration: none;
          box-shadow: 0 10px 20px rgba(176, 141, 109, 0.2);
        }

        .new-btn {
          font-weight: 600;
          opacity: 0.5;
          font-size: 0.9rem;
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
        </div>
    );
}
