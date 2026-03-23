import { toApiError, updateProduct } from '@/lib/app-data-server';
import { requireAuthenticatedUser } from '@/lib/supabase/server';
import type { Product } from '@/types';

export async function PATCH(request: Request) {
  try {
    const { supabase } = await requireAuthenticatedUser();
    const body = (await request.json()) as Product;
    const result = await updateProduct(supabase, body);
    return Response.json(result);
  } catch (error) {
    return Response.json(toApiError(error, 'Failed to update the product.'), { status: error instanceof Error && error.message === 'Unauthorized' ? 401 : 500 });
  }
}
