'use client';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { RecentActivity } from '@/lib/analytics-types';
import { formatTimestamp, formatNumber, getFeatureDisplayName, getActionDisplayName, getStatusColor } from '@/lib/format';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface DetailDrawerProps {
  activity: RecentActivity & { feature: string };
  open: boolean;
  onClose: () => void;
}

export function DetailDrawer({ activity, open, onClose }: DetailDrawerProps) {
  const metadata = activity.metadata || {};

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Activity Details</SheetTitle>
          <SheetDescription>
            Detailed information about this activity
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Basic Info */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-gray-500 uppercase">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-gray-500 mb-1">Feature</div>
                <div className="font-medium">{getFeatureDisplayName(activity.feature)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Action</div>
                <div className="font-medium">{getActionDisplayName(activity.action)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Status</div>
                <Badge className={getStatusColor(activity.status)}>
                  {activity.status}
                </Badge>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Tokens Used</div>
                <div className="font-medium">{formatNumber(activity.tokensUsed)}</div>
              </div>
              <div className="col-span-2">
                <div className="text-xs text-gray-500 mb-1">Timestamp</div>
                <div className="font-medium">{formatTimestamp(activity.timestamp)}</div>
                <div className="text-xs text-gray-400 mt-1">
                  {new Date(activity.timestamp).toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Metadata */}
          {Object.keys(metadata).length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-gray-500 uppercase">Metadata</h3>
              <div className="space-y-2">
                {Object.entries(metadata).map(([key, value]) => {
                  // Handle special cases
                  if (key === 'error') {
                    return (
                      <div key={key} className="p-3 bg-red-50 rounded-lg border border-red-200">
                        <div className="text-xs font-medium text-red-700 mb-1">Error</div>
                        <div className="text-sm text-red-600">{String(value)}</div>
                      </div>
                    );
                  }

                  if (key === 'sourceUrl' || key === 'url') {
                    return (
                      <div key={key}>
                        <div className="text-xs text-gray-500 mb-1">{key}</div>
                        <a
                          href={String(value)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline break-all"
                        >
                          {String(value)}
                        </a>
                      </div>
                    );
                  }

                  if (Array.isArray(value)) {
                    return (
                      <div key={key}>
                        <div className="text-xs text-gray-500 mb-1">{key}</div>
                        <div className="text-sm">
                          {value.map((item, idx) => (
                            <span key={idx} className="inline-block mr-2 mb-1">
                              {String(item)}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={key}>
                      <div className="text-xs text-gray-500 mb-1">{key}</div>
                      <div className="text-sm font-medium">{String(value)}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

