'use client';

import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { formatDateRange } from '@/lib/format';
import { AnalyticsPeriod } from '@/lib/analytics-types';
import { useState } from 'react';

interface DateRangeSelectorProps {
  period: AnalyticsPeriod;
  onDateChange: (startDate: string | null, endDate: string | null) => void;
}

export function DateRangeSelector({ period, onDateChange }: DateRangeSelectorProps) {
  const [startDate, setStartDate] = useState<Date | undefined>(
    period.startDate ? new Date(period.startDate) : undefined
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    period.endDate ? new Date(period.endDate) : undefined
  );
  const [open, setOpen] = useState(false);

  const handleApply = () => {
    onDateChange(
      startDate ? startDate.toISOString() : null,
      endDate ? endDate.toISOString() : null
    );
    setOpen(false);
  };

  const handleClear = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    onDateChange(null, null);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-[280px] justify-start text-left font-normal bg-white/80 border-gray-200"
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {formatDateRange(period.startDate, period.endDate)}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-4 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Start Date</label>
            <Calendar
              mode="single"
              selected={startDate}
              onSelect={setStartDate}
              initialFocus
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">End Date</label>
            <Calendar
              mode="single"
              selected={endDate}
              onSelect={setEndDate}
              disabled={(date) => startDate ? date < startDate : false}
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleApply} className="flex-1">Apply</Button>
            <Button onClick={handleClear} variant="outline" className="flex-1">
              Clear
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

