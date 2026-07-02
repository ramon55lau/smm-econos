import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AdService } from "@/services/ad.service";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const ad = await AdService.getAdById(session.user.id, id);
    if (!ad) {
      return NextResponse.json({ error: "Ad not found" }, { status: 404 });
    }
    return NextResponse.json(ad);
  } catch (error) {
    console.error("GET /api/ads/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch ad details" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const updatedAd = await AdService.updateAd(session.user.id, id, body);
    return NextResponse.json(updatedAd);
  } catch (error: any) {
    console.error("PUT /api/ads/[id] error:", error);
    const status = error.message === "Ad not found or unauthorized" ? 404 : 500;
    return NextResponse.json({ error: error.message || "Failed to update ad" }, { status });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await AdService.deleteAd(session.user.id, id);
    return NextResponse.json({ message: "Ad deleted successfully" });
  } catch (error: any) {
    console.error("DELETE /api/ads/[id] error:", error);
    const status = error.message === "Ad not found or unauthorized" ? 404 : 500;
    return NextResponse.json({ error: error.message || "Failed to delete ad" }, { status });
  }
}

