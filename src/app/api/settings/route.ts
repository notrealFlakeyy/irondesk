import { toApiError, updateSettings } from '@/lib/app-data-server';
import { requireAuthenticatedUser } from '@/lib/supabase/server';
import type { AppSettings } from '@/types';

export async function PUT(request: Request) {
  try {
    const { supabase } = await requireAuthenticatedUser();
    const body = (await request.json()) as AppSettings;
    const result = await updateSettings(supabase, body);
    return Response.json(result);
  } catch (error) {
    return Response.json(toApiError(error, 'Failed to save settings.'), { status: error instanceof Error && error.message === 'Unauthorized' ? 401 : 500 });
  }
}
