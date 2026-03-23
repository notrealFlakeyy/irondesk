import { addProduct, toApiError } from '@/lib/app-data-server';
import type { Product } from '@/types';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Product;
    const result = await addProduct(body);
    return Response.json(result);
  } catch (error) {
    return Response.json(toApiError(error, 'Failed to add the product.'), { status: 500 });
  }
}
