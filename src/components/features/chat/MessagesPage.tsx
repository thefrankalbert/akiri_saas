'use client';

import { useState } from 'react';
import { MessageCircle, Search, Send } from 'lucide-react';
import { Card, CardContent } from '@/components/ui';
import { Input } from '@/components/ui';
import { Avatar } from '@/components/ui';
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
      <h1 className="mb-6 text-2xl font-bold text-neutral-900">Messages</h1>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Conversations list */}
        <div className="lg:col-span-1">
          <Input
            placeholder="Rechercher..."
            leftIcon={<Search className="h-4 w-4" />}
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
                    isSelected ? 'bg-primary-50 border-primary-200 border' : 'hover:bg-neutral-50'
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
                      <p className="truncate text-sm font-medium text-neutral-900">
                        {other ? `${other.first_name} ${other.last_name}` : 'Utilisateur'}
                      </p>
                      {conv.last_message_at && (
                        <span className="shrink-0 text-xs text-neutral-400">
                          {formatRelativeDate(conv.last_message_at)}
                        </span>
                      )}
                    </div>
                    {conv.last_message && (
                      <p className="mt-0.5 truncate text-xs text-neutral-500">
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
                <div className="flex items-center gap-3 border-b border-neutral-200 px-4 py-3">
                  <Avatar
                    firstName={otherParticipant.first_name}
                    lastName={otherParticipant.last_name}
                    size="sm"
                    isVerified={otherParticipant.is_verified}
                  />
                  <div>
                    <p className="text-sm font-semibold text-neutral-900">
                      {otherParticipant.first_name} {otherParticipant.last_name}
                    </p>
                    <p className="text-xs text-neutral-400">
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
                            'max-w-[80%] rounded-2xl px-4 py-2.5',
                            msg.sender === 'me'
                              ? 'bg-primary-500 text-white'
                              : 'bg-neutral-100 text-neutral-900'
                          )}
                        >
                          <p className="text-sm">{msg.text}</p>
                          <p
                            className={cn(
                              'mt-1 text-[10px]',
                              msg.sender === 'me' ? 'text-primary-100' : 'text-neutral-400'
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
                <div className="border-t border-neutral-200 p-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      placeholder="Écrivez un message..."
                      className="focus:border-primary-500 focus:ring-primary-500 flex-1 rounded-full border border-neutral-300 bg-white px-4 py-2.5 text-sm focus:ring-1 focus:outline-none"
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
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <CardContent className="flex h-full items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="mx-auto h-16 w-16 text-neutral-200" />
                  <h3 className="mt-4 font-semibold text-neutral-700">
                    Sélectionnez une conversation
                  </h3>
                  <p className="mt-1 text-sm text-neutral-500">
                    Choisissez une conversation dans la liste pour commencer
                  </p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
