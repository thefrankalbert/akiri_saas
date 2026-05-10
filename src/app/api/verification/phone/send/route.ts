// ============================================
// Phone OTP Send API Route
// ============================================

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendPhoneOtpSchema } from '@/lib/validations';
import { createVerificationService } from '@/lib/services/verification';
import { apiSuccess, apiError, withServiceHandler } from '@/lib/api/helpers';
import { rateLimit } from '@/lib/api/rate-limit';

export async function POST(request: Request) {
  return withServiceHandler('POST /api/verification/phone/send', async () => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return apiError('Non autorisé', 401);
    }

    const limit = await rateLimit(`otp-send:${user.id}`, { maxRequests: 3, windowMs: 60_000 });
    if (!limit.success) {
      return apiError('Trop de tentatives, réessayez plus tard', 429);
    }

    const body = await request.json();
    const parsed = sendPhoneOtpSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(parsed.error.issues[0].message, 400);
    }

    const adminSupabase = await createAdminClient();
    const service = createVerificationService(supabase, adminSupabase);
    const data = await service.sendPhoneOtp(user.id, parsed.data.phone);

    return apiSuccess(data);
  });
}
