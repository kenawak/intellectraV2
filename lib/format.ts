/**
 * Formatting utilities for analytics dashboard
 */

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}

export function formatDate(dateString: string | null): string {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

export function formatDateRange(startDate: string | null, endDate: string | null): string {
  if (!startDate || !endDate) return 'All time';
  const start = formatDate(startDate);
  const end = formatDate(endDate);
  return `${start} - ${end}`;
}

export function formatTimestamp(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

export function formatDuration(ms: string | number): string {
  const num = typeof ms === 'string' ? parseFloat(ms) : ms;
  if (isNaN(num)) return '—';
  if (num < 1000) return `${Math.round(num)}ms`;
  if (num < 60000) return `${(num / 1000).toFixed(1)}s`;
  return `${(num / 60000).toFixed(1)}m`;
}

export function formatPercentage(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0%';
  return `${num.toFixed(1)}%`;
}

export function getFeatureDisplayName(feature: string): string {
  const names: Record<string, string> = {
    'bookmark': 'Bookmarks',
    'idea-validator': 'Idea Validator',
    'market-opportunities': 'Market Opportunities',
    'new-project': 'New Project',
  };
  return names[feature] || feature;
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    'success': 'text-green-600 bg-green-50',
    'error': 'text-red-600 bg-red-50',
    'rate_limited': 'text-yellow-600 bg-yellow-50',
  };
  return colors[status] || 'text-gray-600 bg-gray-50';
}

export function getActionDisplayName(action: string): string {
  return action.charAt(0).toUpperCase() + action.slice(1);
}

