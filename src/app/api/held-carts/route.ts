import { holdCart, toApiError } from '@/lib/app-data-server';
import { requireAuthenticatedUser } from '@/lib/supabase/server';
import type { HoldCartParams } from '@/types';

export async function POST(request: Request) {
  try {
    const { supabase } = await requireAuthenticatedUser();
    const body = (await request.json()) as HoldCartParams;
    const result = await holdCart(supabase, body);
    return Response.json(result);
  } catch (error) {
    return Response.json(toApiError(error, 'Failed to hold the cart.'), {
      status: error instanceof Error && error.message === 'Unauthorized' ? 401 : 500,
    });
  }
}
