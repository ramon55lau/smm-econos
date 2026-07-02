import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AdService } from "@/services/ad.service";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const userAds = await AdService.getUserAds(session.user.id);
    return NextResponse.json(userAds);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch ads" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const ad = await AdService.createAd(session.user.id, body);
    return NextResponse.json(ad, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/ads error:", error?.message, error);
    const status = error.message === "Campaign not found or unauthorized" ? 404 : 500;
    return NextResponse.json({ error: error?.message || "Failed to create ad" }, { status });
  }
}
