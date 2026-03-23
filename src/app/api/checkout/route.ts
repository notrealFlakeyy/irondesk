import { checkoutCart, toApiError } from '@/lib/app-data-server';
import type { CheckoutCartParams } from '@/types';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CheckoutCartParams;
    const result = await checkoutCart(body);
    return Response.json(result);
  } catch (error) {
    return Response.json(toApiError(error, 'Failed to complete checkout.'), { status: 500 });
  }
}
