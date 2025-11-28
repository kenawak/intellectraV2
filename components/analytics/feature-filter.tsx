'use client';

import { Button } from '@/components/ui/button';
import { getFeatureDisplayName } from '@/lib/format';
import { FeatureName } from '@/lib/analytics-types';

interface FeatureFilterProps {
  features: FeatureName[];
  selectedFeature: string | null;
  onFeatureSelect: (feature: string | null) => void;
}

export function FeatureFilter({ features, selectedFeature, onFeatureSelect }: FeatureFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant={selectedFeature === null ? 'default' : 'outline'}
        size="sm"
        onClick={() => onFeatureSelect(null)}
        className="rounded-full"
      >
        All Features
      </Button>
      {features.map((feature) => (
        <Button
          key={feature}
          variant={selectedFeature === feature ? 'default' : 'outline'}
          size="sm"
          onClick={() => onFeatureSelect(feature)}
          className="rounded-full"
        >
          {getFeatureDisplayName(feature)}
        </Button>
      ))}
    </div>
  );
}

