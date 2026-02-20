import Image from 'next/image';
import { cn, getInitials } from '@/lib/utils';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  alt?: string;
  firstName?: string;
  lastName?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isVerified?: boolean;
}

const sizeStyles: Record<string, string> = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
};

export function Avatar({
  className,
  src,
  alt,
  firstName = '',
  lastName = '',
  size = 'md',
  isVerified,
  ...props
}: AvatarProps) {
  const initials = getInitials(firstName, lastName);

  return (
    <div className={cn('relative inline-flex shrink-0', className)} {...props}>
      {src ? (
        <div className={cn('relative overflow-hidden rounded-full', sizeStyles[size])}>
          <Image
            src={src}
            alt={alt || `${firstName} ${lastName}`}
            fill
            sizes="64px"
            className="object-cover"
          />
        </div>
      ) : (
        <div
          className={cn(
            'bg-primary-100 text-primary-700 flex items-center justify-center rounded-full font-semibold',
            sizeStyles[size]
          )}
        >
          {initials || '?'}
        </div>
      )}
      {isVerified && (
        <div className="bg-secondary-500 absolute -right-0.5 -bottom-0.5 flex h-4 w-4 items-center justify-center rounded-full text-white">
          <svg className="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      )}
    </div>
  );
}
