import { toApiError, updateSettings } from '@/lib/app-data-server';
import type { AppSettings } from '@/types';

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as AppSettings;
    const result = await updateSettings(body);
    return Response.json(result);
  } catch (error) {
    return Response.json(toApiError(error, 'Failed to save settings.'), { status: 500 });
  }
}
