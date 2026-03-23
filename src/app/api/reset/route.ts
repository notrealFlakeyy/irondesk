import { clearWorkspace, toApiError } from '@/lib/app-data-server';
import { requireAuthenticatedUser } from '@/lib/supabase/server';

export async function POST() {
  try {
    const { supabase, user } = await requireAuthenticatedUser();
    const result = await clearWorkspace(supabase, user.id);
    return Response.json(result);
  } catch (error) {
    return Response.json(toApiError(error, 'Failed to clear the workspace.'), { status: error instanceof Error && error.message === 'Unauthorized' ? 401 : 500 });
  }
}
