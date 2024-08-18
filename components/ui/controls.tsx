import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown, ChevronUp } from 'lucide-react';
import { DatePickerWithRange } from './date-range-picker';
import { ControlsProps } from 'charts/ChartComponent';

export const CustomControls: React.FC<ControlsProps> = ({
  selectedTimeframe,
  selectedBucket,
  buckets,
  categoryCount,
  useDateRange,
  dateRange,
  settings,
  onTimeframeChange,
  onBucketChange,
  onCategoryCountChange,
  onDateRangeChange
}) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
    <Select onValueChange={onBucketChange} value={selectedBucket}>
      <SelectTrigger>
        <SelectValue placeholder="Select a bucket" />
      </SelectTrigger>
      <SelectContent>
        {buckets.map((bucket) => (
          <SelectItem key={bucket} value={bucket}>
            {bucket}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
    <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#3f4144', borderRadius: '4px', padding: '2px' }}>
      <button onClick={() => onCategoryCountChange(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
        <ChevronDown color={settings.textColor} size={20} />
      </button>
      <span style={{ margin: '0 8px', color: settings.textColor }}>{categoryCount}</span>
      <button onClick={() => onCategoryCountChange(1)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
        <ChevronUp color={settings.textColor} size={20} />
      </button>
    </div>
    {useDateRange && (
      <DatePickerWithRange
        dateRange={dateRange}
        onDateRangeChange={onDateRangeChange}
      />
    )}
  </div>
);