import { checkoutCart, toApiError } from '@/lib/app-data-server';
import { requireAuthenticatedUser } from '@/lib/supabase/server';
import type { CheckoutCartParams } from '@/types';

export async function POST(request: Request) {
  try {
    const { supabase } = await requireAuthenticatedUser();
    const body = (await request.json()) as CheckoutCartParams;
    const result = await checkoutCart(supabase, body);
    return Response.json(result);
  } catch (error) {
    return Response.json(toApiError(error, 'Failed to complete checkout.'), { status: error instanceof Error && error.message === 'Unauthorized' ? 401 : 500 });
  }
}
