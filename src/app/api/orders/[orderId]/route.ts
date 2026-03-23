import { updateOrderStatus, toApiError } from '@/lib/app-data-server';
import type { Order } from '@/types';

export async function PATCH(request: Request, context: { params: Promise<{ orderId: string }> }) {
  try {
    const { status } = (await request.json()) as { status: Order['status'] };
    const { orderId } = await context.params;
    const result = await updateOrderStatus(orderId, status);
    return Response.json(result);
  } catch (error) {
    return Response.json(toApiError(error, 'Failed to update the order.'), { status: 500 });
  }
}
