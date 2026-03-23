import { toApiError, updateProduct } from '@/lib/app-data-server';
import type { Product } from '@/types';

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as Product;
    const result = await updateProduct(body);
    return Response.json(result);
  } catch (error) {
    return Response.json(toApiError(error, 'Failed to update the product.'), { status: 500 });
  }
}
