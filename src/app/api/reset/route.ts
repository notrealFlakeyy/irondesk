import { resetDemoData, toApiError } from '@/lib/app-data-server';

export async function POST() {
  try {
    const result = await resetDemoData();
    return Response.json(result);
  } catch (error) {
    return Response.json(toApiError(error, 'Failed to reset demo data.'), { status: 500 });
  }
}
