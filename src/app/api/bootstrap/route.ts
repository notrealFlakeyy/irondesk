import { loadAppData, toApiError } from '@/lib/app-data-server';
import { requireAuthenticatedUser } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { supabase } = await requireAuthenticatedUser();
    const data = await loadAppData(supabase);
    return Response.json({ data });
  } catch (error) {
    return Response.json(toApiError(error, 'Failed to load IronDesk data.'), { status: error instanceof Error && error.message === 'Unauthorized' ? 401 : 500 });
  }
}
