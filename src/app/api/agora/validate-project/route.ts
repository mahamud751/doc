import { NextRequest, NextResponse } from "next/server";

// This endpoint validates the Agora project configuration
export async function GET(request: NextRequest) {
  try {
    const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE;

    // Check if environment variables are set
    if (!appId) {
      return NextResponse.json(
        {
          error: "NEXT_PUBLIC_AGORA_APP_ID not found in environment variables",
          solution:
            "Add NEXT_PUBLIC_AGORA_APP_ID to your .env file with a valid Agora App ID",
        },
        { status: 500 }
      );
    }

    if (!appCertificate) {
      return NextResponse.json(
        {
          error: "AGORA_APP_CERTIFICATE not found in environment variables",
          solution:
            "Add AGORA_APP_CERTIFICATE to your .env file with a valid Agora Certificate",
        },
        { status: 500 }
      );
    }

    // Validate App ID format
    if (appId.length !== 32) {
      return NextResponse.json(
        {
          error: `Invalid App ID length: ${appId.length}, expected 32 characters`,
          appIdLength: appId.length,
          appId: appId,
          solution: "Ensure your App ID is exactly 32 characters long",
        },
        { status: 500 }
      );
    }

    // Validate Certificate format
    if (appCertificate.length !== 32) {
      return NextResponse.json(
        {
          error: `Invalid Certificate length: ${appCertificate.length}, expected 32 characters`,
          certLength: appCertificate.length,
          cert: appCertificate,
          solution: "Ensure your Certificate is exactly 32 characters long",
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
          appId: appId,
          solution:
            "App ID should only contain hexadecimal characters (0-9, a-f)",
        },
        { status: 500 }
      );
    }

    if (!hexRegex.test(appCertificate)) {
      return NextResponse.json(
        {
          error: "Certificate contains invalid characters",
          cert: appCertificate,
          solution:
            "Certificate should only contain hexadecimal characters (0-9, a-f)",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Agora project configuration appears valid",
      appId: `${appId.substring(0, 8)}...`,
      certificate: `${appCertificate.substring(0, 8)}...`,
      instructions:
        "If you're still getting 'invalid vendor key' errors, your Agora project may not be properly configured on Agora's servers. Please check your Agora dashboard.",
    });
  } catch (error: any) {
    console.error("Project validation error:", error);

    return NextResponse.json(
      {
        error: "Failed to validate Agora project",
        message: error.message || "Unknown error",
        solution:
          "Check your environment variables and Agora project configuration",
      },
      { status: 500 }
    );
  }
}
