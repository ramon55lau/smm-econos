"use client";

import UnifiedFlow, { ScrapedData } from "@/components/flow/UnifiedFlow";

export default function NewAdPage() {
  const manualData: ScrapedData = {
    title: "",
    description: "",
    images: [],
    videos: [],
    hashtags: [],
    suggestedComment: "",
    linkUrl: "Publicación Manual",
  };

  return (
    <main style={{ minHeight: "100vh", background: "#f7f3f0", paddingTop: "20px" }}>
      <UnifiedFlow initialStep="selection" initialData={manualData} />
    </main>
  );
}
