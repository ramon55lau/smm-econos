"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ScreenLinkInput from "./ScreenLinkInput";
import ScreenPlatformSelection from "./ScreenPlatformSelection";
import ScreenAdEditor from "./ScreenAdEditor";
import PublishModal from "./PublishModal";
import SuccessScreen from "./SuccessScreen";

export type ScrapedData = {
    title: string;
    description: string;
    images: string[];
    videos: { url: string; thumbnail?: string; type?: string; duration?: number }[];
    hashtags: string[];
    suggestedComment: string;
    linkUrl: string;
    price?: string;
    city?: string;
};

export type FlowStep = "input" | "selection" | "editor" | "success";
export type Platform = "facebook" | "instagram" | "youtube" | "google-ads" | "display";

type Props = {
    initialStep?: FlowStep;
    initialData?: ScrapedData | null;
};

export default function UnifiedFlow({ initialStep = "input", initialData = null }: Props) {
    const [step, setStep] = useState<FlowStep>(initialStep);
    const [scrapedData, setScrapedData] = useState<ScrapedData | null>(initialData);
    const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);
    const [adId, setAdId] = useState<string | null>(null);
    const [publishedUrl, setPublishedUrl] = useState<string>("");
    const [showPublishModal, setShowPublishModal] = useState(false);

    // Transitions
    const handleDataScraped = (data: ScrapedData) => {
        setScrapedData(data);
        setStep("selection");
    };

    const router = useRouter();

    const handleManual = () => {
        router.push("/ads/new");
    };

    const handlePlatformSelected = (platform: Platform) => {
        setSelectedPlatform(platform);
        setStep("editor");
    };

    const handlePublishClick = (updatedData?: ScrapedData) => {
        if (updatedData) {
            setScrapedData(updatedData);
        }
        setShowPublishModal(true);
    };

    const handlePublished = (id: string, url: string) => {
        setAdId(id);
        setPublishedUrl(url);
        setShowPublishModal(false);
        setStep("success");
    };

    return (
        <>
            <div className="unified-flow-container">
                {step === "input" && (
                    <ScreenLinkInput onScraped={handleDataScraped} onManual={handleManual} />
                )}

                {step === "selection" && scrapedData && (
                    <ScreenPlatformSelection
                        data={scrapedData}
                        onSelect={handlePlatformSelected}
                        onBack={() => {
                            if (initialStep === "selection") router.push("/dashboard");
                            else setStep("input");
                        }}
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
                    <SuccessScreen adId={adId} postUrl={publishedUrl} onReset={() => setStep("input")} />
                )}

                <style jsx>{`
            .unified-flow-container {
              width: 100%;
              min-height: calc(100vh - 80px);
              display: flex;
              flex-direction: column;
              animation: none;
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
