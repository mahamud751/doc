import { NextRequest } from "next/server";

// Mock Agora token generation for testing purposes
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { channelName, uid, role } = body;

    // Validate required parameters
    if (!channelName || !uid) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // In a real implementation, you would generate a proper Agora token here
    // For testing purposes, we'll return a mock token
    const mockToken = `mock_token_${channelName}_${uid}_${Date.now()}`;
    const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID || "mock_app_id";

    return new Response(
      JSON.stringify({
        token: mockToken,
        appId: appId,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating Agora token:", error);
    return new Response(JSON.stringify({ error: "Failed to generate token" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
