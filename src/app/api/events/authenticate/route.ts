import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

interface AuthRequest {
  userId: string;
  userRole: string;
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const { userId, userRole }: AuthRequest = await request.json();

    if (!userId || !userRole) {
      return NextResponse.json({ error: 'Missing userId or userRole' }, { status: 400 });
    }

    // For development, we'll accept any token that decodes successfully
    // In production, you should validate the token properly
    try {
      // Just check if token is valid format - don't verify signature for now
      const decoded = jwt.decode(token);
      if (!decoded) {
        throw new Error('Invalid token');
      }
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    console.log(`[REAL-TIME API] User authenticated: ${userId} (${userRole})`);

    return NextResponse.json({ 
      success: true, 
      userId, 
      userRole,
      timestamp: Date.now()
    });

  } catch (error) {
    console.error('[REAL-TIME API] Authentication error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}