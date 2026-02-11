// ============================================
// API Route Helpers
// ============================================

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { ZodType } from 'zod/v4';

/**
 * Get the authenticated user from the request
 */
export async function getAuthUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

/**
 * Return a standardized error response
 */
export function apiError(message: string, status: number = 400) {
  return NextResponse.json({ data: null, error: message, status }, { status });
}

/**
 * Return a standardized success response
 */
export function apiSuccess<T>(data: T, status: number = 200) {
  return NextResponse.json({ data, error: null, status }, { status });
}

/**
 * Parse and validate the JSON body of a request
 */
export async function parseBody<T>(request: Request, schema: ZodType<T>): Promise<T | null> {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);
    if (!result.success) {
      return null;
    }
    return result.data;
  } catch {
    return null;
  }
}

/**
 * Parse and validate URL search params
 */
export function parseSearchParams<T>(url: string, schema: ZodType<T>): T | null {
  try {
    const { searchParams } = new URL(url);
    const params: Record<string, string | number> = {};

    searchParams.forEach((value, key) => {
      // Try to convert numeric strings
      const num = Number(value);
      params[key] = !isNaN(num) && value !== '' ? num : value;
    });

    const result = schema.safeParse(params);
    if (!result.success) {
      return null;
    }
    return result.data;
  } catch {
    return null;
  }
}
