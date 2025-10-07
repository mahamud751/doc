import { NextResponse } from "next/server";

export async function GET() {
  try {
    const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID;

    if (!appId) {
      return NextResponse.json(
        { error: "Agora App ID not configured" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      appId,
      status: "success"
    });
  } catch (error) {
    console.error("Error getting Agora config:", error);
    return NextResponse.json(
      { error: "Failed to get Agora configuration" },
      { status: 500 }
    );
  }
}