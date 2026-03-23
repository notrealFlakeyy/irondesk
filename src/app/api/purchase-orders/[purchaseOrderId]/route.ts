import { toApiError, updatePurchaseOrderStatus } from '@/lib/app-data-server';
import { requireAuthenticatedUser } from '@/lib/supabase/server';
import type { PurchaseOrder } from '@/types';

export async function PATCH(
  request: Request,
  context: { params: Promise<{ purchaseOrderId: string }> }
) {
  try {
    const { supabase } = await requireAuthenticatedUser();
    const { status } = (await request.json()) as { status: PurchaseOrder['status'] };
    const { purchaseOrderId } = await context.params;
    const result = await updatePurchaseOrderStatus(supabase, purchaseOrderId, status);
    return Response.json(result);
  } catch (error) {
    return Response.json(toApiError(error, 'Failed to update the purchase order.'), {
      status: error instanceof Error && error.message === 'Unauthorized' ? 401 : 500,
    });
  }
}
