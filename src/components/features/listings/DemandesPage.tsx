'use client';

import { useEffect, useState } from 'react';
import { PaperPlaneTilt, Package, Tray } from '@phosphor-icons/react';
import { UnderlineTabs, Shimmer, FadeIn, StaggerContainer, StaggerItem } from '@/components/ui';
import { createClient, supabaseConfigured } from '@/lib/supabase/client';
import { mockRequests } from '@/lib/mock-data';
import { RequestCard } from '@/components/features/requests/RequestCard';
import type { ShipmentRequest } from '@/types';

// For demo mode, simulate current user
const MOCK_CURRENT_USER = 'mock-user-001';

export function DemandesPage() {
  const [requests, setRequests] = useState<ShipmentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('sent');

  useEffect(() => {
    if (!supabaseConfigured) {
      queueMicrotask(() => {
        setRequests(mockRequests);
        setLoading(false);
      });
      return;
    }

    const controller = new AbortController();

    const fetchRequests = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || controller.signal.aborted) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from('shipment_requests')
        .select(
          '*, listing:listings!listing_id(*, traveler:profiles!traveler_id(*)), sender:profiles!sender_id(*)'
        )
        .or(`sender_id.eq.${user.id},listing.traveler_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (controller.signal.aborted) return;

      setRequests((data as unknown as ShipmentRequest[]) || []);
      setLoading(false);
    };

    fetchRequests();

    return () => controller.abort();
  }, []);

  // Filter by role
  const sentRequests = requests.filter((r) => {
    if (supabaseConfigured) return true; // Server-side filter handles it
    return r.sender_id === MOCK_CURRENT_USER;
  });

  const receivedRequests = requests.filter((r) => {
    if (supabaseConfigured) return true;
    return r.listing?.traveler_id === MOCK_CURRENT_USER || r.sender_id !== MOCK_CURRENT_USER;
  });

  const tabs = [
    {
      id: 'sent',
      label: 'Mes envois',
      icon: <PaperPlaneTilt weight="duotone" size={14} />,
      count: sentRequests.length,
    },
    {
      id: 'received',
      label: 'Demandes reçues',
      icon: <Tray weight="duotone" size={14} />,
      count: receivedRequests.length,
    },
  ];

  const displayedRequests = activeTab === 'sent' ? sentRequests : receivedRequests;
  const currentRole = activeTab === 'sent' ? 'sender' : 'traveler';

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-6">
        <Shimmer className="mb-6 h-8 w-48" />
        <Shimmer className="mb-4 h-10 w-full" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Shimmer key={i} className="h-48 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <h1 className="mb-6 text-xl font-bold text-neutral-100">Demandes d&apos;envoi</h1>

      <UnderlineTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      <FadeIn key={activeTab}>
        <div className="mt-6">
          {displayedRequests.length > 0 ? (
            <StaggerContainer className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {displayedRequests.map((request) => (
                <StaggerItem key={request.id}>
                  <RequestCard request={request} role={currentRole} />
                </StaggerItem>
              ))}
            </StaggerContainer>
          ) : (
            <div className="py-16 text-center">
              <Package weight="duotone" size={40} className="text-surface-300 mx-auto" />
              <p className="text-surface-100 mt-3 text-sm">
                {activeTab === 'sent'
                  ? "Vous n'avez pas encore envoyé de demande."
                  : "Vous n'avez pas encore reçu de demande."}
              </p>
            </div>
          )}
        </div>
      </FadeIn>
    </div>
  );
}
