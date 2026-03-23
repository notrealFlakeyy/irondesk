import { resolveHeldCartAction, toApiError } from '@/lib/app-data-server';
import { requireAuthenticatedUser } from '@/lib/supabase/server';

type Params = {
  params: Promise<{
    heldCartId: string;
  }>;
};

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { supabase } = await requireAuthenticatedUser();
    const { heldCartId } = await params;
    const body = (await request.json()) as { action?: 'resume' | 'delete' };

    if (body.action !== 'resume' && body.action !== 'delete') {
      return Response.json({ error: 'Invalid held cart action.' }, { status: 400 });
    }

    const result = await resolveHeldCartAction(supabase, heldCartId, body.action);
    return Response.json(result);
  } catch (error) {
    return Response.json(toApiError(error, 'Failed to update the held cart.'), {
      status: error instanceof Error && error.message === 'Unauthorized' ? 401 : 500,
    });
  }
}
