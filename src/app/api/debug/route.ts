import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('🔍 DEBUG ENDPOINT: Received data:', {
      timestamp: new Date().toISOString(),
      body,
      headers: Object.fromEntries(request.headers.entries()),
      url: request.url,
    });

    return NextResponse.json({
      success: true,
      message: 'Debug data logged successfully',
      receivedData: body,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ DEBUG ENDPOINT: Error:', error);
    return NextResponse.json(
      { error: 'Failed to process debug request', details: String(error) },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  console.log('🔍 DEBUG ENDPOINT: GET request received', {
    timestamp: new Date().toISOString(),
    url: request.url,
    params: Object.fromEntries(new URL(request.url).searchParams.entries()),
  });

  return NextResponse.json({
    success: true,
    message: 'Debug endpoint is working',
    timestamp: new Date().toISOString(),
  });
}