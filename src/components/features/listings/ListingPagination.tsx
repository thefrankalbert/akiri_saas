'use client';

import { Button } from '@/components/ui';

interface ListingPaginationProps {
  currentPage: number;
  totalPages: number;
  onGoToPage: (page: number) => void;
}

export function ListingPagination({ currentPage, totalPages, onGoToPage }: ListingPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-8 flex justify-center gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled={currentPage <= 1}
        onClick={() => onGoToPage(currentPage - 1)}
      >
        Précédent
      </Button>
      <span className="text-surface-100 flex items-center px-3 text-sm">
        Page {currentPage} / {totalPages}
      </span>
      <Button
        variant="outline"
        size="sm"
        disabled={currentPage >= totalPages}
        onClick={() => onGoToPage(currentPage + 1)}
      >
        Suivant
      </Button>
    </div>
  );
}
