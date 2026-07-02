import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { CampaignService } from "@/services/campaign.service";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const campaigns = await CampaignService.getUserCampaigns(session.user.id);
    return NextResponse.json(campaigns);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch campaigns" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const campaign = await CampaignService.createCampaign(session.user.id, body);
    return NextResponse.json(campaign);
  } catch (error: any) {
    const status = error.message === "Name is required" ? 400 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
