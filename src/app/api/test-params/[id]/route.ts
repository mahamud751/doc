import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    
    return NextResponse.json({
      message: "Params received successfully",
      id: id,
      params: resolvedParams
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Failed to process params" },
      { status: 500 }
    );
  }
}