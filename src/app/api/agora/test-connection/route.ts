import { NextRequest, NextResponse } from "next/server";

// This endpoint tests if we can access Agora services
export async function GET(request: NextRequest) {
  try {
    const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID;

    if (!appId) {
      return NextResponse.json(
        {
          error: "NEXT_PUBLIC_AGORA_APP_ID not found in environment variables",
          status: "error",
        },
        { status: 500 }
      );
    }

    // Simple validation - just check if the format looks correct
    if (appId.length !== 32) {
      return NextResponse.json(
        {
          error: `Invalid App ID length: ${appId.length}, expected 32 characters`,
          status: "error",
        },
        { status: 500 }
      );
    }

    // Check if App ID contains only valid hexadecimal characters
    const hexRegex = /^[0-9a-fA-F]+$/;
    if (!hexRegex.test(appId)) {
      return NextResponse.json(
        {
          error: "App ID contains invalid characters",
          status: "error",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Environment configuration looks correct",
      appId: `${appId.substring(0, 8)}...`,
      status: "success",
    });
  } catch (error: any) {
    console.error("Connection test error:", error);

    return NextResponse.json(
      {
        error: "Failed to test Agora connection",
        message: error.message || "Unknown error",
        status: "error",
      },
      { status: 500 }
    );
  }
}
