import { NextResponse } from 'next/server';
import { getApiBaseUrl } from '@/lib/backend';

function getBearerToken(request: Request) {
  const authorization = request.headers.get('authorization');
  if (!authorization || !authorization.startsWith('Bearer ')) {
    return null;
  }
  return authorization.slice(7);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const accessToken = getBearerToken(request);
  if (!accessToken) {
    return NextResponse.json({ error: 'Missing access token' }, { status: 401 });
  }

  const reportId = Number((await params).id);
  const body = await request.json().catch(() => ({}));
  const response = await fetch(`${getApiBaseUrl()}/status-reports/${reportId}/publish`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  });

  const payload = await response.json().catch(() => ({ error: 'Failed to publish report' }));
  return NextResponse.json(payload, { status: response.status });
}
