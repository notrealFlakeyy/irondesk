import { updateOrderStatus, toApiError } from '@/lib/app-data-server';
import { requireAuthenticatedUser } from '@/lib/supabase/server';
import type { Order } from '@/types';

export async function PATCH(request: Request, context: { params: Promise<{ orderId: string }> }) {
  try {
    const { supabase } = await requireAuthenticatedUser();
    const { status } = (await request.json()) as { status: Order['status'] };
    const { orderId } = await context.params;
    const result = await updateOrderStatus(supabase, orderId, status);
    return Response.json(result);
  } catch (error) {
    return Response.json(toApiError(error, 'Failed to update the order.'), { status: error instanceof Error && error.message === 'Unauthorized' ? 401 : 500 });
  }
}
