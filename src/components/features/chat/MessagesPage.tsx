'use client';

import { useState } from 'react';
import { ChatCircle, MagnifyingGlass, PaperPlaneRight } from '@phosphor-icons/react';
import { Card, CardContent } from '@/components/ui';
import { Input } from '@/components/ui';
import { Avatar } from '@/components/ui';
import { FadeIn } from '@/components/ui/Motion';
import { cn } from '@/lib/utils';
import { formatRelativeDate } from '@/lib/utils';
import { mockConversations, mockProfiles } from '@/lib/mock-data';

// Simulated chat messages for selected conversation
const mockMessages = [
  {
    id: 'm1',
    sender: 'other',
    text: 'Bonjour ! Je suis intéressée par votre annonce Paris-Douala.',
    time: '10:00',
  },
  {
    id: 'm2',
    sender: 'me',
    text: "Bonjour ! Oui bien sûr. Qu'est-ce que vous souhaitez envoyer ?",
    time: '10:02',
  },
  {
    id: 'm3',
    sender: 'other',
    text: 'Des vêtements et des chaussures pour ma famille. Environ 5kg.',
    time: '10:05',
  },
  {
    id: 'm4',
    sender: 'me',
    text: "Pas de problème, j'ai encore de la place. On peut se retrouver Gare du Nord samedi ?",
    time: '10:08',
  },
  {
    id: 'm5',
    sender: 'other',
    text: 'Parfait ! Samedi matin ça me convient. Je fais la demande sur la plateforme.',
    time: '10:12',
  },
  {
    id: 'm6',
    sender: 'me',
    text: "Super, j'accepte dès que je reçois la notification. À samedi !",
    time: '10:15',
  },
];

export function MessagesPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');

  // Use mock user as "me" (mockProfiles[0])
  const currentUser = mockProfiles[0];

  const selectedConversation = mockConversations.find((c) => c.id === selectedId);
  const otherParticipant = selectedConversation?.participants?.find(
    (p) => p.user_id !== currentUser.user_id
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-2xl font-bold text-neutral-100">Messages</h1>

      <FadeIn>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Conversations list */}
          <div className="lg:col-span-1">
            <Input
              placeholder="Rechercher..."
              leftIcon={<MagnifyingGlass size={16} />}
              className="mb-4"
            />

            <div className="space-y-1">
              {mockConversations.map((conv) => {
                const isSelected = conv.id === selectedId;
                const other = conv.participants?.find((p) => p.user_id !== currentUser.user_id);

                return (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedId(conv.id)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors',
                      isSelected
                        ? 'border-primary-500 bg-surface-700 border-l-2'
                        : 'hover:bg-surface-700'
                    )}
                  >
                    <Avatar
                      firstName={other?.first_name || 'U'}
                      lastName={other?.last_name || ''}
                      size="md"
                      isVerified={other?.is_verified}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="truncate text-sm font-medium text-neutral-100">
                          {other ? `${other.first_name} ${other.last_name}` : 'Utilisateur'}
                        </p>
                        {conv.last_message_at && (
                          <span className="text-surface-200 shrink-0 text-xs">
                            {formatRelativeDate(conv.last_message_at)}
                          </span>
                        )}
                      </div>
                      {conv.last_message && (
                        <p className="text-surface-100 mt-0.5 truncate text-xs">
                          {conv.last_message}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Chat area */}
          <div className="lg:col-span-2">
            <Card className="flex h-[calc(100vh-16rem)] min-h-[400px] flex-col">
              {selectedId && otherParticipant ? (
                <>
                  {/* Chat header */}
                  <div className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-3">
                    <Avatar
                      firstName={otherParticipant.first_name}
                      lastName={otherParticipant.last_name}
                      size="sm"
                      isVerified={otherParticipant.is_verified}
                    />
                    <div>
                      <p className="text-sm font-semibold text-neutral-100">
                        {otherParticipant.first_name} {otherParticipant.last_name}
                      </p>
                      <p className="text-surface-200 text-xs">
                        {otherParticipant.is_verified ? 'Profil vérifié' : 'Membre'}
                      </p>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto px-4 py-4">
                    <div className="space-y-3">
                      {mockMessages.map((msg) => (
                        <div
                          key={msg.id}
                          className={cn(
                            'flex',
                            msg.sender === 'me' ? 'justify-end' : 'justify-start'
                          )}
                        >
                          <div
                            className={cn(
                              'max-w-[80%] px-4 py-2.5',
                              msg.sender === 'me'
                                ? 'bg-primary-600 rounded-2xl rounded-br-sm text-white'
                                : 'bg-surface-700 rounded-2xl rounded-bl-sm text-neutral-100'
                            )}
                          >
                            <p className="text-sm">{msg.text}</p>
                            <p
                              className={cn(
                                'mt-1 text-[10px]',
                                msg.sender === 'me' ? 'text-primary-200' : 'text-surface-200'
                              )}
                            >
                              {msg.time}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Input */}
                  <div className="border-t border-white/[0.06] p-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        placeholder="Écrivez un message..."
                        className="bg-surface-700 placeholder:text-surface-200 focus:border-primary-500 focus:ring-primary-500 flex-1 rounded-full border border-white/[0.08] px-4 py-2.5 text-sm text-neutral-100 focus:ring-1 focus:outline-none"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && messageInput.trim()) {
                            setMessageInput('');
                          }
                        }}
                      />
                      <button
                        className="bg-primary-500 hover:bg-primary-600 flex h-10 w-10 items-center justify-center rounded-full text-white transition-colors"
                        onClick={() => {
                          if (messageInput.trim()) {
                            setMessageInput('');
                          }
                        }}
                      >
                        <PaperPlaneRight size={16} />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <CardContent className="flex h-full items-center justify-center">
                  <div className="text-center">
                    <ChatCircle className="text-surface-300 mx-auto" size={64} />
                    <h3 className="mt-4 font-semibold text-neutral-100">
                      Sélectionnez une conversation
                    </h3>
                    <p className="text-surface-100 mt-1 text-sm">
                      Choisissez une conversation dans la liste pour commencer
                    </p>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        </div>
      </FadeIn>
    </div>
  );
}
