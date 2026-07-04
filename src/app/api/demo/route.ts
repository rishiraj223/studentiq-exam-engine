import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Server-to-server fetch completely bypasses browser CORS restrictions!
    const response = await fetch('https://studentiq.vercel.app/api/demo/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: result.message || 'Failed to submit request to main portal.' },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true, message: 'Demo request submitted successfully!' });
  } catch (error) {
    console.error('Proxy demo submit error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error while connecting to main portal.' },
      { status: 500 }
    );
  }
}
