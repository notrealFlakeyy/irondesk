import { loadAppData, toApiError } from '@/lib/app-data-server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await loadAppData();
    return Response.json({ data });
  } catch (error) {
    return Response.json(toApiError(error, 'Failed to load IronDesk data.'), { status: 500 });
  }
}
