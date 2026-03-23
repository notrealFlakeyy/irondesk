import { addSupplier, toApiError } from '@/lib/app-data-server';
import type { Supplier } from '@/types';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Supplier;
    const result = await addSupplier(body);
    return Response.json(result);
  } catch (error) {
    return Response.json(toApiError(error, 'Failed to add the supplier.'), { status: 500 });
  }
}
