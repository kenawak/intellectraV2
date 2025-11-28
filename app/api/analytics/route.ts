import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

/**
 * GET /api/analytics
 * 
 * Redirects to the new comprehensive feature analytics endpoint.
 * This maintains backward compatibility while using the new system.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Redirect to the new feature analytics endpoint
    const baseUrl = req.nextUrl.origin;
    const analyticsUrl = new URL('/api/analytics/features', baseUrl);
    
    // Copy query parameters
    req.nextUrl.searchParams.forEach((value, key) => {
      analyticsUrl.searchParams.set(key, value);
    });

    // Fetch from the new endpoint
    const response = await fetch(analyticsUrl.toString(), {
      headers: {
        'Cookie': req.headers.get('cookie') || '',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch analytics' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("Error fetching analytics:", err);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}