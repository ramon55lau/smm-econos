"use client";

import { useState } from "react";
import ScreenLinkInput from "./ScreenLinkInput";
import ScreenPlatformSelection from "./ScreenPlatformSelection";
import ScreenAdEditor from "./ScreenAdEditor";
import PublishModal from "./PublishModal";
import SuccessScreen from "./SuccessScreen";

export type ScrapedData = {
    title: string;
    description: string;
    images: string[];
    videos: { url: string; thumbnail?: string; type?: string }[];
    hashtags: string[];
    suggestedComment: string;
    linkUrl: string;
    price?: string;
    city?: string;
};

export type FlowStep = "input" | "selection" | "editor" | "success";
export type Platform = "facebook" | "instagram" | "youtube" | "google-ads" | "display";

export default function UnifiedFlow() {
    const [step, setStep] = useState<FlowStep>("input");
    const [scrapedData, setScrapedData] = useState<ScrapedData | null>(null);
    const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);
    const [adId, setAdId] = useState<string | null>(null);
    const [showPublishModal, setShowPublishModal] = useState(false);

    // Transitions
    const handleDataScraped = (data: ScrapedData) => {
        setScrapedData(data);
        setStep("selection");
    };

    const handlePlatformSelected = (platform: Platform) => {
        setSelectedPlatform(platform);
        setStep("editor");
    };

    const handlePublishClick = () => {
        console.log("Publish button clicked, showing modal for platform:", selectedPlatform);
        setShowPublishModal(true);
    };

    const handlePublished = (id: string) => {
        setAdId(id);
        setShowPublishModal(false);
        setStep("success");
    };

    return (
        <>
            <div className="unified-flow-container">
                {step === "input" && (
                    <ScreenLinkInput onScraped={handleDataScraped} />
                )}

                {step === "selection" && scrapedData && (
                    <ScreenPlatformSelection
                        data={scrapedData}
                        onSelect={handlePlatformSelected}
                        onBack={() => setStep("input")}
                    />
                )}

                {step === "editor" && scrapedData && selectedPlatform && (
                    <ScreenAdEditor
                        data={scrapedData}
                        platform={selectedPlatform}
                        onPublish={handlePublishClick}
                        onBack={() => setStep("selection")}
                    />
                )}

                {step === "success" && adId && (
                    <SuccessScreen adId={adId} onReset={() => setStep("input")} />
                )}

                <style jsx>{`
            .unified-flow-container {
              width: 100%;
              min-height: calc(100vh - 80px);
              display: flex;
              flex-direction: column;
              animation: fadeIn 0.5s ease-out;
            }
          `}</style>
            </div>

            {showPublishModal && scrapedData && selectedPlatform && (
                <PublishModal
                    data={scrapedData}
                    platform={selectedPlatform}
                    onClose={() => setShowPublishModal(false)}
                    onSuccess={handlePublished}
                />
            )}
        </>
    );
}
