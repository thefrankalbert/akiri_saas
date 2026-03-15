import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthUser, apiError } from '@/lib/api/helpers';

export async function GET() {
  const user = await getAuthUser();
  if (!user) return apiError('Non autorisé', 401);

  const supabase = await createClient();

  // Fetch all user data
  const [profile, listings, requests, transactions, reviews, conversations, notifications] =
    await Promise.all([
      supabase.from('profiles').select('*').eq('user_id', user.id).single(),
      supabase.from('listings').select('*').eq('traveler_id', user.id),
      supabase.from('shipment_requests').select('*').eq('sender_id', user.id),
      supabase.from('transactions').select('*').or(`payer_id.eq.${user.id},payee_id.eq.${user.id}`),
      supabase
        .from('reviews')
        .select('*')
        .or(`reviewer_id.eq.${user.id},reviewed_id.eq.${user.id}`),
      supabase.from('conversations').select('*').contains('participant_ids', [user.id]),
      supabase.from('notifications').select('*').eq('user_id', user.id),
    ]);

  const exportData = {
    exported_at: new Date().toISOString(),
    user: { id: user.id, email: user.email },
    profile: profile.data,
    listings: listings.data,
    shipment_requests: requests.data,
    transactions: transactions.data,
    reviews: reviews.data,
    conversations: conversations.data,
    notifications: notifications.data,
  };

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="akiri-export-${user.id}.json"`,
    },
  });
}
