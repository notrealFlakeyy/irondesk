import { createPurchaseOrder, toApiError } from '@/lib/app-data-server';
import { requireAuthenticatedUser } from '@/lib/supabase/server';
import type { CreatePurchaseOrderParams } from '@/types';

export async function POST(request: Request) {
  try {
    const { supabase } = await requireAuthenticatedUser();
    const body = (await request.json()) as CreatePurchaseOrderParams;
    const result = await createPurchaseOrder(supabase, body);
    return Response.json(result);
  } catch (error) {
    return Response.json(toApiError(error, 'Failed to create the purchase order.'), {
      status: error instanceof Error && error.message === 'Unauthorized' ? 401 : 500,
    });
  }
}
