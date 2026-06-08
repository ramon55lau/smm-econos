"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import styles from "./Ads.module.css";
import React, { Suspense } from "react";

type Ad = {
  id: string;
  title: string;
  description: string;
  mediaType: string;
  mediaUrl: string;
  thumbnailUrl: string;
  linkUrl?: string;
  createdAt: string;
  campaign: { name: string };
  publications: {
    id: string;
    type: string; // "paid", "organic"
    status: string;
    platform: string;
    externalPostId?: string;
    externalPostUrl?: string;
  }[];
};

function AdsList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialFilter = searchParams.get("filter") || "all";

  const [ads, setAds] = useState<Ad[]>([]);
  const [platformFilter, setPlatformFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [filter, setFilter] = useState(initialFilter);
  const [loading, setLoading] = useState(true);
  const [viewingAd, setViewingAd] = useState<Ad | null>(null);
  const [viewingIndex, setViewingIndex] = useState(0);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    setFilter(searchParams.get("filter") || "all");
    setTypeFilter(searchParams.get("filter") || "all");
  }, [searchParams]);

  const fetchAds = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ads");
      if (res.ok) setAds(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAds(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este anuncio? Esta acción no se puede deshacer.")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/ads/${id}`, { method: "DELETE" });
      if (res.ok) {
        setAds(prev => prev.filter(a => a.id !== id));
        setViewingAd(null);
      } else {
        alert("Error al eliminar el anuncio");
      }
    } catch {
      alert("Error de conexión");
    } finally {
      setDeleting(null);
    }
  };

  if (loading) return <div className={styles.container}>Cargando anuncios...</div>;

  // Flatten ads into a list of publications for reporting
  const adReports = ads.flatMap(ad => {
    if (ad.publications.length === 0) {
      return [{
        ...ad,
        platform: "None",
        type: "draft",
        status: "draft",
        externalPostUrl: undefined,
        isAd: false
      }];
    }
    return ad.publications.map(p => {
      let platform = p.platform || "Unknown";

      // Normalize platform name
      if (platform.toLowerCase().includes("facebook")) platform = "Facebook";
      else if (platform.toLowerCase().includes("instagram")) platform = "Instagram";
      else if (platform.toLowerCase().includes("youtube")) platform = "YouTube";
      else if (platform.toLowerCase().includes("google")) platform = "Google Ads";
      else platform = platform.charAt(0).toUpperCase() + platform.slice(1);

      let postUrl = p.externalPostUrl;

      // Fallback for older publications that only have externalPostId
      if (!postUrl && p.externalPostId) {
        const postId = p.externalPostId;
        const lowPlat = platform.toLowerCase();
        if (lowPlat.includes("facebook")) postUrl = `https://www.facebook.com/${postId}`;
        else if (lowPlat.includes("youtube")) postUrl = `https://www.youtube.com/watch?v=${postId}`;
      }

      return {
        ...ad,
        platform,
        type: p.type,
        status: p.status,
        externalPostUrl: postUrl,
        isAd: true
      };
    });
  });

  const filteredReports = adReports.filter(report => {
    // Type Filter
    const matchesType = typeFilter === "all" ||
      (typeFilter === "ads" && report.type === "paid") ||
      (typeFilter === "organic" && report.type === "organic") ||
      (typeFilter === "drafts" && report.type === "draft");

    // Platform Filter
    const matchesPlatform = platformFilter === "all" ||
      report.platform.toLowerCase() === platformFilter.toLowerCase();

    return matchesType && matchesPlatform;
  });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Reportes de Anuncios</h2>
        <Link href="/ads/new" className={styles.addBtn}>
          <span>+</span> Crear Anuncio
        </Link>
      </div>

      <div className={styles.filterSection}>
        <div className={styles.filterGroup}>
          <label>Categoría</label>
          <div className={styles.tabsDesktop}>
            {["all", "ads", "organic", "drafts"].map(t => (
              <button
                key={t}
                className={`${styles.tabSmall} ${typeFilter === t ? styles.activeTab : ""}`}
                onClick={() => setTypeFilter(t)}
              >
                {t === "all" ? "Todos" : t === "ads" ? "Ads" : t === "organic" ? "Orgánico" : "Borradores"}
              </button>
            ))}
          </div>
          <select
            className={styles.mobileSelect}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">Todos</option>
            <option value="ads">Ads</option>
            <option value="organic">Orgánico</option>
            <option value="drafts">Borradores</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label>Plataforma</label>
          <div className={styles.tabsDesktop}>
            {["all", "facebook", "instagram", "youtube"].map(p => (
              <button
                key={p}
                className={`${styles.tabSmall} ${platformFilter === p ? styles.activeTab : ""}`}
                onClick={() => setPlatformFilter(p)}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
          <select
            className={styles.mobileSelect}
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
          >
            <option value="all">Todas las redes</option>
            <option value="facebook">Facebook</option>
            <option value="instagram">Instagram</option>
            <option value="youtube">YouTube</option>
            <option value="google-ads">Google Ads</option>
          </select>
        </div>
      </div>

      {filteredReports.length === 0 ? (
        <div className={`glass-panel ${styles.empty}`}>
          <div className={styles.emptyIcon}>🔍</div>
          <p>No se encontraron registros con estos filtros.</p>
        </div>
      ) : (
        <>
          <div className={`glass-panel ${styles.tableWrapper}`}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Contenido</th>
                  <th>Campaña</th>
                  <th>Plataforma</th>
                  <th>Tipo</th>
                  <th>Estado</th>
                  <th>Link</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map((report, idx) => (
                  <tr key={`${report.id}-${idx}`}>
                    <td>
                      <div className={styles.contentCell}>
                        {report.mediaUrl ? (
                          <img src={report.mediaUrl.split(',')[0]} className={styles.miniMedia} alt="" />
                        ) : (
                          <div className={styles.miniMediaPlaceholder}>🖼️</div>
                        )}
                        <div className={styles.contentText}>
                          <div className={styles.reportTitle}>{report.title}</div>
                          <div className={styles.reportDate}>{new Date(report.createdAt).toLocaleDateString()}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className={styles.campaignName}>{report.campaign.name}</span></td>
                    <td>
                      <span className={`${styles.platformBadge} ${styles[report.platform.toLowerCase()]}`}>
                        {report.platform}
                      </span>
                    </td>
                    <td>
                      <span className={report.type === "paid" ? styles.typePaid : styles.typeOrganic}>
                        {report.type === "paid" ? "🎯 ADS" : report.type === "organic" ? "🍃 Orgánico" : "📝 Borrador"}
                      </span>
                    </td>
                    <td>
                      <span className={`${styles.statusBadge} ${styles[report.status]}`}>
                        {report.status === "published" ? "✅ Activo" : report.status === "failed" ? "❌ Error" : "⏳ Pendiente"}
                      </span>
                    </td>
                    <td>
                      {report.externalPostUrl ? (
                        <a href={report.externalPostUrl} target="_blank" rel="noopener noreferrer" className={styles.liveLink}>
                          🔗 Ver Online
                        </a>
                      ) : (
                        <span className={styles.noLink}>-</span>
                      )}
                    </td>
                    <td>
                      <div className={styles.rowActions}>
                        <button className={styles.rowBtn} onClick={() => setViewingAd(report as any)}>👁️</button>
                        <button className={styles.rowBtn} onClick={() => router.push(`/ads/${report.id}`)}>✏️</button>
                        <button className={`${styles.rowBtn} ${styles.rowBtnDanger}`} onClick={() => handleDelete(report.id)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className={styles.mobileCards}>
            {filteredReports.map((report, idx) => (
              <div key={`m-${report.id}-${idx}`} className={`glass-panel ${styles.mobileCard}`}>
                <div className={styles.mobileCardHeader}>
                  {report.mediaUrl ? (
                    <img src={report.mediaUrl.split(',')[0]} className={styles.mobileCardImg} alt="" />
                  ) : (
                    <div className={styles.mobileCardImgPlaceholder}>🖼️</div>
                  )}
                  <div className={styles.mobileCardInfo}>
                    <div className={styles.mobileCardTitle}>{report.title}</div>
                    <div className={styles.mobileCardDate}>{new Date(report.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>
                <div className={styles.mobileCardRow}>
                  <span className={styles.mobileLabel}>Campaña</span>
                  <span className={styles.campaignName}>{report.campaign.name}</span>
                </div>
                <div className={styles.mobileCardRow}>
                  <span className={styles.mobileLabel}>Plataforma</span>
                  <span className={`${styles.platformBadge} ${styles[report.platform.toLowerCase()]}`}>{report.platform}</span>
                </div>
                <div className={styles.mobileCardRow}>
                  <span className={styles.mobileLabel}>Tipo</span>
                  <span className={report.type === "paid" ? styles.typePaid : styles.typeOrganic}>
                    {report.type === "paid" ? "🎯 ADS" : report.type === "organic" ? "🍃 Orgánico" : "📝 Borrador"}
                  </span>
                </div>
                <div className={styles.mobileCardRow}>
                  <span className={styles.mobileLabel}>Estado</span>
                  <span className={`${styles.statusBadge} ${styles[report.status]}`}>
                    {report.status === "published" ? "✅ Activo" : report.status === "failed" ? "❌ Error" : "⏳ Pendiente"}
                  </span>
                </div>
                {report.externalPostUrl && (
                  <a href={report.externalPostUrl} target="_blank" rel="noopener noreferrer" className={styles.mobileCardLink}>
                    🔗 Ver publicación en vivo
                  </a>
                )}
                <div className={styles.mobileCardActions}>
                  <button className={styles.rowBtn} onClick={() => setViewingAd(report as any)}>👁️</button>
                  <button className={styles.rowBtn} onClick={() => router.push(`/ads/${report.id}`)}>✏️</button>
                  <button className={`${styles.rowBtn} ${styles.rowBtnDanger}`} onClick={() => handleDelete(report.id)}>🗑️</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Preview Modal */}
      {viewingAd && (
        <div className={styles.modalOverlay} onClick={() => setViewingAd(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button className={styles.modalClose} onClick={() => setViewingAd(null)}>✕</button>

            {viewingAd.mediaUrl && viewingAd.mediaType === "image" && (() => {
              const urls = viewingAd.mediaUrl.split(',');
              const currentUrl = urls[viewingIndex] || urls[0];
              const next = (e: React.MouseEvent) => { e.stopPropagation(); setViewingIndex((i) => (i + 1) % urls.length); };
              const prev = (e: React.MouseEvent) => { e.stopPropagation(); setViewingIndex((i) => (i - 1 + urls.length) % urls.length); };
              return (
                <div style={{ position: "relative" }}>
                  <img src={currentUrl} alt={viewingAd.title} className={styles.modalMedia} />
                  {urls.length > 1 && (
                    <>
                      <button type="button" onClick={prev} className={styles.carouselBtn} style={{ left: 10 }}>◀</button>
                      <button type="button" onClick={next} className={styles.carouselBtn} style={{ right: 10 }}>▶</button>
                      <div className={styles.carouselDots}>
                        {urls.map((_: any, i: number) => (
                          <div key={i} className={`${styles.carouselDot} ${i === viewingIndex ? styles.carouselDotActive : ""}`} />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              );
            })()}
            {viewingAd.mediaUrl && viewingAd.mediaType === "video" && (
              <video
                src={viewingAd.mediaUrl.split(',')[0]}
                poster={viewingAd.thumbnailUrl || undefined}
                controls
                className={styles.modalMedia}
                style={{ width: "100%" }}
              />
            )}
            {!viewingAd.mediaUrl && (
              <div className={styles.modalMediaPlaceholder}>🖼️</div>
            )}

            <div className={styles.modalBody}>
              <h3 className={styles.modalTitle}>{viewingAd.title}</h3>

              {(viewingAd as any).externalPostUrl && (
                <a href={(viewingAd as any).externalPostUrl} target="_blank" rel="noopener noreferrer" className={styles.modalLiveLink}>
                  🌐 Ver publicación en vivo ({(viewingAd as any).platform})
                </a>
              )}

              {viewingAd.description && <p className={styles.modalDesc}>{viewingAd.description}</p>}
              {viewingAd.linkUrl && (
                <a href={viewingAd.linkUrl} target="_blank" rel="noopener noreferrer" className={styles.modalLink}>
                  🔗 Enlace de destino: {viewingAd.linkUrl}
                </a>
              )}
              <div className={styles.modalMeta}>
                <span>📁 {viewingAd.campaign.name}</span>
                <span className={styles.mediaBadge}>{viewingAd.mediaType}</span>
                <span>📅 {new Date(viewingAd.createdAt).toLocaleDateString()}</span>
              </div>

              <div className={styles.modalActions}>
                <button className={styles.modalBtn} onClick={() => { setViewingAd(null); router.push(`/ads/${viewingAd.id}`); }}>
                  ✏️ Editar
                </button>
                <button className={styles.modalBtn} onClick={() => { setViewingAd(null); router.push(`/ads/${viewingAd.id}/publish`); }}>
                  🚀 Publicar
                </button>
                <button
                  className={`${styles.modalBtn} ${styles.modalBtnDanger}`}
                  onClick={() => handleDelete(viewingAd.id)}
                  disabled={deleting === viewingAd.id}
                >
                  {deleting === viewingAd.id ? "Eliminando..." : "🗑️ Eliminar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdsPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <AdsList />
    </Suspense>
  );
}
