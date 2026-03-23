import { addCustomer, toApiError } from '@/lib/app-data-server';
import type { Customer } from '@/types';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Customer;
    const result = await addCustomer(body);
    return Response.json(result);
  } catch (error) {
    return Response.json(toApiError(error, 'Failed to add the customer.'), { status: 500 });
  }
}
