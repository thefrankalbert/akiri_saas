'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Phone, CheckCircle, ArrowLeft, SpinnerGap } from '@phosphor-icons/react';
import {
  Button,
  Input,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui';
import {
  sendPhoneOtpSchema,
  verifyPhoneOtpSchema,
  type SendPhoneOtpInput,
  type VerifyPhoneOtpInput,
} from '@/lib/validations';
import { cn } from '@/lib/utils';

interface PhoneVerificationProps {
  isVerified: boolean;
  currentPhone?: string | null;
  onVerified?: () => void;
  className?: string;
}

type Step = 'phone' | 'otp';

export function PhoneVerification({
  isVerified,
  currentPhone,
  onVerified,
  className,
}: PhoneVerificationProps) {
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState(currentPhone || '');
  const [serverError, setServerError] = useState<string | null>(null);
  const [mockCodeHint, setMockCodeHint] = useState<string | null>(null);

  // Phone form
  const phoneForm = useForm<SendPhoneOtpInput>({
    resolver: zodResolver(sendPhoneOtpSchema),
    defaultValues: {
      phone: currentPhone || '',
    },
  });

  // OTP form
  const otpForm = useForm<VerifyPhoneOtpInput>({
    resolver: zodResolver(verifyPhoneOtpSchema),
    defaultValues: {
      phone: '',
      code: '',
    },
  });

  const handleSendOtp = async (data: SendPhoneOtpInput) => {
    setServerError(null);
    setMockCodeHint(null);

    try {
      const response = await fetch('/api/verification/phone/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        setServerError(result.error || 'Une erreur est survenue');
        return;
      }

      // Extract mock code from message if present (dev mode)
      if (result.message && result.message.includes('Code:')) {
        const codeMatch = result.message.match(/Code:\s*(\d{6})/);
        if (codeMatch) {
          setMockCodeHint(codeMatch[1]);
        }
      }

      setPhone(data.phone);
      otpForm.setValue('phone', data.phone);
      setStep('otp');
    } catch {
      setServerError('Erreur de connexion au serveur');
    }
  };

  const handleVerifyOtp = async (data: VerifyPhoneOtpInput) => {
    setServerError(null);

    try {
      const response = await fetch('/api/verification/phone/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, phone }),
      });

      const result = await response.json();

      if (!response.ok) {
        setServerError(result.error || 'Code invalide');
        return;
      }

      onVerified?.();
    } catch {
      setServerError('Erreur de connexion au serveur');
    }
  };

  const handleGoBack = () => {
    setStep('phone');
    setServerError(null);
    setMockCodeHint(null);
    otpForm.reset();
  };

  const handleResendCode = async () => {
    if (phone) {
      await handleSendOtp({ phone });
    }
  };

  // Already verified state
  if (isVerified) {
    return (
      <Card className={cn('border-success/20 bg-success/5', className)}>
        <CardContent className="flex items-center gap-3">
          <div className="bg-success/10 flex h-10 w-10 items-center justify-center rounded-full">
            <CheckCircle className="text-success" size={20} />
          </div>
          <div>
            <p className="text-success font-medium">Téléphone vérifié</p>
            {currentPhone && <p className="text-success/80 text-sm">{currentPhone}</p>}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center gap-2">
          {step === 'otp' && (
            <button
              type="button"
              onClick={handleGoBack}
              className="text-surface-200 hover:bg-surface-700 rounded-lg p-1"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <div>
            <CardTitle>
              {step === 'phone' ? 'Vérifier votre téléphone' : 'Entrez le code'}
            </CardTitle>
            <CardDescription>
              {step === 'phone'
                ? 'Nous vous enverrons un code de vérification par SMS'
                : `Code envoyé au ${phone}`}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {serverError && (
          <div className="bg-error/10 text-error mb-4 rounded-xl px-4 py-3 text-sm">
            {serverError}
          </div>
        )}

        {step === 'phone' ? (
          <form onSubmit={phoneForm.handleSubmit(handleSendOtp)} className="space-y-4">
            <Input
              label="Numéro de téléphone"
              type="tel"
              placeholder="+33 6 12 34 56 78"
              leftIcon={<Phone size={16} />}
              error={phoneForm.formState.errors.phone?.message}
              hint="Format international avec indicatif pays"
              {...phoneForm.register('phone')}
            />

            <Button type="submit" className="w-full" isLoading={phoneForm.formState.isSubmitting}>
              Envoyer le code
            </Button>
          </form>
        ) : (
          <form onSubmit={otpForm.handleSubmit(handleVerifyOtp)} className="space-y-4">
            {mockCodeHint && (
              <div className="bg-warning/10 text-warning rounded-xl px-4 py-3 text-sm">
                <span className="font-medium">Mode test :</span> Utilisez le code{' '}
                <code className="bg-warning/20 rounded px-1.5 py-0.5 font-mono">
                  {mockCodeHint}
                </code>
              </div>
            )}

            <Input
              label="Code de vérification"
              type="text"
              inputMode="numeric"
              placeholder="123456"
              maxLength={6}
              error={otpForm.formState.errors.code?.message}
              hint="Entrez le code à 6 chiffres reçu par SMS"
              {...otpForm.register('code')}
            />

            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={handleGoBack} className="flex-1">
                Modifier
              </Button>
              <Button type="submit" className="flex-1" isLoading={otpForm.formState.isSubmitting}>
                Vérifier
              </Button>
            </div>

            <button
              type="button"
              onClick={handleResendCode}
              disabled={phoneForm.formState.isSubmitting}
              className="text-primary-400 hover:text-primary-300 w-full text-center text-sm disabled:opacity-50"
            >
              {phoneForm.formState.isSubmitting ? (
                <span className="inline-flex items-center gap-1">
                  <SpinnerGap className="animate-spin" size={12} />
                  Envoi en cours...
                </span>
              ) : (
                'Renvoyer le code'
              )}
            </button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
