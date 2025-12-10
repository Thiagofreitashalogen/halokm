import { KnowledgeEntry } from '@/types/knowledge';
import { CategoryBadge } from './CategoryBadge';
import { StatusBadge } from './StatusBadge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { Building2, Calendar, DollarSign, CheckCircle, XCircle, Lightbulb } from 'lucide-react';

interface EntryDetailSheetProps {
  entry: KnowledgeEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EntryDetailSheet({ entry, open, onOpenChange }: EntryDetailSheetProps) {
  if (!entry) return null;

  const status = entry.offerStatus || entry.projectStatus;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="space-y-4">
          <div className="flex items-center gap-2">
            <CategoryBadge category={entry.category} />
            {status && <StatusBadge status={status} />}
          </div>
          <SheetTitle className="text-xl font-semibold text-left">
            {entry.title}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Meta info */}
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            {entry.client && (
              <span className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4" />
                {entry.client}
              </span>
            )}
            {entry.proposalValue && (
              <span className="flex items-center gap-1.5">
                <DollarSign className="w-4 h-4" />
                {entry.proposalValue.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              Updated {format(entry.updatedAt, 'MMM d, yyyy')}
            </span>
          </div>

          <Separator />

          {/* Description */}
          <div>
            <h4 className="text-sm font-medium mb-2">Description</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {entry.description}
            </p>
          </div>

          {/* Tags */}
          {entry.tags.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Tags</h4>
              <div className="flex flex-wrap gap-1.5">
                {entry.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="font-normal">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Project specific: Learnings */}
          {entry.learnings && entry.learnings.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4 text-status-pending" />
                Key Learnings
              </h4>
              <ul className="space-y-2">
                {entry.learnings.map((learning, idx) => (
                  <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-muted-foreground/50 mt-1">•</span>
                    {learning}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Offer specific: Win factors */}
          {entry.winFactors && entry.winFactors.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-status-won" />
                Win Factors
              </h4>
              <ul className="space-y-2">
                {entry.winFactors.map((factor, idx) => (
                  <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-status-won mt-1">•</span>
                    {factor}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Offer specific: Loss reasons */}
          {entry.lossReasons && entry.lossReasons.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
                <XCircle className="w-4 h-4 text-status-lost" />
                Loss Reasons
              </h4>
              <ul className="space-y-2">
                {entry.lossReasons.map((reason, idx) => (
                  <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-status-lost mt-1">•</span>
                    {reason}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Method specific: Use case */}
          {entry.useCase && (
            <div>
              <h4 className="text-sm font-medium mb-2">When to Use</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {entry.useCase}
              </p>
            </div>
          )}

          {/* Method specific: Steps */}
          {entry.steps && entry.steps.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Steps</h4>
              <ol className="space-y-2">
                {entry.steps.map((step, idx) => (
                  <li key={idx} className="text-sm text-muted-foreground flex items-start gap-3">
                    <span className="text-xs font-medium bg-muted text-muted-foreground rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
