'use client';

import { useState, useEffect } from 'react';
import { useDashboardData } from '@/lib/use-dashboard-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, Area, AreaChart, Legend } from 'recharts';
import { TrendingUp, TrendingDown, Crown, Sparkles } from 'lucide-react';
import { formatNumber } from '@/lib/format';
import { Badge } from '@/components/ui/badge';
import { authClient } from '@/lib/auth-client';

// Chart colors optimized for both light and dark modes
const COLORS = [
  'oklch(0.65 0.25 35)',      // Primary red/orange - visible in dark
  'oklch(0.70 0.20 150)',     // Green - visible in dark
  'oklch(0.70 0.20 250)',     // Blue - visible in dark
  'oklch(0.75 0.20 75)',      // Yellow - visible in dark
  'oklch(0.70 0.20 300)',     // Purple - visible in dark
];

export default function DashboardPage() {
  const { data, loading, error } = useDashboardData({});
  const { data: session } = authClient.useSession();
  const [userProfile, setUserProfile] = useState<{
    plan: string | null;
    paid: boolean | null;
  } | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // Combine profile fetch with session data to reduce API calls
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        // Only fetch if session exists to avoid unnecessary calls
        if (!session?.user) {
          setProfileLoading(false);
          return;
        }
        
        const response = await fetch('/api/user/profile', {
          credentials: 'include',
        });
        if (response.ok) {
          const profileData = await response.json();
          setUserProfile({
            plan: profileData.plan || null,
            paid: profileData.paid ?? null,
          });
        }
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
      } finally {
        setProfileLoading(false);
      }
    };

    // Only fetch profile after session is confirmed
    if (!session) return;
    fetchUserProfile();
  }, [session]);

  if (error) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-destructive/20 border border-destructive/30 rounded-2xl p-6 text-center">
            <h2 className="text-xl font-semibold text-destructive mb-2">Error Loading Analytics</h2>
            <p className="text-destructive/80">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // Calculate summary metrics
  const totalActions = data?.overall.totalActions || 0;
  const successfulActions = data?.overall.successfulActions || 0;
  const totalTokens = data?.overall.totalTokens || 0;
  const successRate = totalActions > 0 ? ((successfulActions / totalActions) * 100).toFixed(1) : '0';

  // Prepare activity data (last 7 days simulation)
  const activityData = [
    { day: 'Mo', success: successfulActions > 0 ? Math.floor(successfulActions * 0.15) : 0, failed: Math.floor((totalActions - successfulActions) * 0.1) || 0 },
    { day: 'Tu', success: successfulActions > 0 ? Math.floor(successfulActions * 0.18) : 0, failed: Math.floor((totalActions - successfulActions) * 0.12) || 0 },
    { day: 'We', success: successfulActions > 0 ? Math.floor(successfulActions * 0.20) : 0, failed: Math.floor((totalActions - successfulActions) * 0.08) || 0 },
    { day: 'Th', success: successfulActions > 0 ? Math.floor(successfulActions * 0.17) : 0, failed: Math.floor((totalActions - successfulActions) * 0.15) || 0 },
    { day: 'Fr', success: successfulActions > 0 ? Math.floor(successfulActions * 0.12) : 0, failed: Math.floor((totalActions - successfulActions) * 0.10) || 0 },
    { day: 'Sa', success: successfulActions > 0 ? Math.floor(successfulActions * 0.10) : 0, failed: Math.floor((totalActions - successfulActions) * 0.05) || 0 },
    { day: 'Su', success: successfulActions > 0 ? Math.floor(successfulActions * 0.08) : 0, failed: Math.floor((totalActions - successfulActions) * 0.05) || 0 },
  ];

  // Prepare performance data (last 4 weeks)
  const performanceData = [
    { week: 'Week 1', value: totalActions > 0 ? Math.floor(totalActions * 0.2) : 0 },
    { week: 'Week 2', value: totalActions > 0 ? Math.floor(totalActions * 0.25) : 0 },
    { week: 'Week 3', value: totalActions > 0 ? Math.floor(totalActions * 0.3) : 0 },
    { week: 'Week 4', value: totalActions },
  ];

  // Prepare feature distribution data
  const featureData = data?.features
    .map((feature, index) => ({
      name: feature.feature.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      value: feature.summary.totalActions,
      color: COLORS[index % COLORS.length],
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 3)
    .map((item, index) => ({
      ...item,
      color: COLORS[index % COLORS.length],
    })) || [];

  const totalFeatureActions = featureData.reduce((sum, item) => sum + item.value, 0);

  // Determine plan display
  const planDisplay = userProfile?.plan 
    ? userProfile.plan.charAt(0).toUpperCase() + userProfile.plan.slice(1)
    : userProfile?.paid 
      ? 'Pro'
      : 'Free';
  
  const isPro = userProfile?.plan === 'pro' || userProfile?.plan === 'enterprise' || userProfile?.paid === true;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Welcome Message */}
        <Card className="rounded-2xl shadow-lg border-primary/20">
          <CardContent className="p-6">
            {profileLoading ? (
              <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="">
                    {isPro ? (
                      <Crown className="h-6 w-6 text-primary" />
                    ) : (
                      <Sparkles className="h-6 w-6 text-primary" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-card-foreground">
                      Welcome{session?.user?.name ? `, ${session?.user?.name}` : ''}!
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      You are currently on the{' '}
                      <Badge variant={isPro ? 'default' : 'secondary'} className="ml-1">
                        {planDisplay} Plan
                      </Badge>
                    </p>
                  </div>
                </div>
                {!isPro && (
                  <a
                    href="/pricing"
                    className="text-sm text-primary hover:text-primary/80 hover:underline font-medium"
                  >
                    Upgrade to Pro →
                  </a>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Actions */}
          <Card className="rounded-2xl shadow-lg">
            <CardContent className="p-6">
              <div className="text-sm text-muted-foreground mb-2">Total Actions</div>
              {loading ? (
                <Skeleton className="h-10 w-24" />
              ) : (
                <>
                  <div className="text-3xl font-bold text-card-foreground mb-2">{formatNumber(totalActions)}</div>
                  <div className="flex items-center gap-1 text-green-500 dark:text-green-400 text-xs">
                    <TrendingUp className="h-3 w-3" />
                    <span>10% more than avg</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Successful Actions */}
          <Card className="rounded-2xl shadow-lg">
            <CardContent className="p-6">
              <div className="text-sm text-muted-foreground mb-2">Success Rate</div>
              {loading ? (
                <Skeleton className="h-10 w-24" />
              ) : (
                <>
                  <div className="text-3xl font-bold text-card-foreground mb-2">{successRate}%</div>
                  <div className="text-xs text-muted-foreground">{formatNumber(successfulActions)} successful</div>
                  <div className="flex items-center gap-1 text-red-500 dark:text-red-400 text-xs mt-1">
                    <TrendingDown className="h-3 w-3" />
                    <span>5% less than avg</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Total Tokens */}
          <Card className="rounded-2xl shadow-lg">
            <CardContent className="p-6">
              <div className="text-sm text-muted-foreground mb-2">Total Tokens</div>
              {loading ? (
                <Skeleton className="h-10 w-24" />
              ) : (
                <>
                  <div className="text-3xl font-bold text-card-foreground mb-2">{formatNumber(totalTokens)}</div>
                  <div className="flex items-center gap-1 text-green-500 dark:text-green-400 text-xs">
                    <TrendingUp className="h-3 w-3" />
                    <span>10% more than avg</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Features Count */}
          <Card className="rounded-2xl shadow-lg">
            <CardContent className="p-6">
              <div className="text-sm text-muted-foreground mb-2">Active Features</div>
              {loading ? (
                <Skeleton className="h-10 w-24" />
              ) : (
                <>
                  <div className="text-3xl font-bold text-card-foreground mb-2">{data?.features.length || 0}</div>
                  <div className="text-xs text-muted-foreground">Features tracked</div>
                  <div className="flex items-center gap-1 text-red-500 dark:text-red-400 text-xs mt-1">
                    <TrendingDown className="h-3 w-3" />
                    <span>25% less than avg</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          {/* Activity Bar Chart */}
          <Card className="rounded-2xl shadow-lg flex flex-col h-full">
            <CardHeader>
              <CardTitle className="text-lg">Activity</CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              {loading ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-primary" />
                      <span className="text-xs text-muted-foreground">Success</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-destructive" />
                      <span className="text-xs text-muted-foreground">Failed</span>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={activityData}>
                      <XAxis dataKey="day" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                      <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          color: 'hsl(var(--card-foreground))',
                        }}
                      />
                      <Bar dataKey="success" fill="oklch(0.65 0.25 35)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="failed" fill="oklch(0.69 0.20 23.99)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </>
              )}
            </CardContent>
          </Card>

          {/* Performance Line Chart */}
          <Card className="rounded-2xl shadow-lg flex flex-col h-full">
            <CardHeader>
              <CardTitle className="text-lg">Performance</CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              {loading ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={performanceData}>
                    <defs>
                      <linearGradient id="performanceGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="oklch(0.65 0.25 35)" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="oklch(0.65 0.25 35)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="week" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                    <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        color: 'hsl(var(--card-foreground))',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="oklch(0.65 0.25 35)"
                      strokeWidth={2}
                      fill="url(#performanceGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Features Speedometer */}
          <Card className="rounded-2xl shadow-lg flex flex-col h-full">
            <CardHeader>
              <CardTitle className="text-lg">Features</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              {loading ? (
                <Skeleton className="h-64 w-full" />
              ) : featureData.length > 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center">
                  {/* Speedometer SVG */}
                  <div className="relative w-full max-w-[280px] aspect-square mb-4">
                    <svg viewBox="0 0 200 120" className="w-full h-full">
                      <defs>
                        <linearGradient id="speedGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          {featureData.map((item, index) => {
                            const startPercent = featureData.slice(0, index).reduce((sum, f) => sum + (f.value / totalFeatureActions) * 100, 0);
                            const endPercent = startPercent + (item.value / totalFeatureActions) * 100;
                            return (
                              <>
                                <stop key={`start-${index}`} offset={`${startPercent}%`} stopColor={item.color} />
                                <stop key={`end-${index}`} offset={`${endPercent}%`} stopColor={item.color} />
                              </>
                            );
                          })}
                        </linearGradient>
                      </defs>
                      {/* Background arc */}
                      <path
                        d="M 20 100 A 80 80 0 0 1 180 100"
                        fill="none"
                        stroke="hsl(var(--muted))"
                        strokeWidth="14"
                        strokeLinecap="round"
                      />
                      {/* Colored speedometer arc */}
                      <path
                        d="M 20 100 A 80 80 0 0 1 180 100"
                        fill="none"
                        stroke="url(#speedGradient)"
                        strokeWidth="12"
                        strokeLinecap="round"
                        strokeDasharray={`${(totalFeatureActions / (totalFeatureActions * 1.2)) * 251.2} 251.2`}
                        strokeDashoffset="125.6"
                      />
                      {/* Needle */}
                      <g transform="translate(100, 100)">
                        <line
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="-75"
                          stroke="hsl(var(--foreground))"
                          strokeWidth="3"
                          strokeLinecap="round"
                          transform={`rotate(${(totalFeatureActions / (totalFeatureActions * 1.2)) * 180 - 90})`}
                        />
                        <circle cx="0" cy="0" r="8" fill="hsl(var(--foreground))" />
                        <circle cx="0" cy="0" r="4" fill="hsl(var(--card))" />
                      </g>
                      {/* Scale marks */}
                      {[0, 25, 50, 75, 100].map((mark) => {
                        const angle = (mark / 100) * 180 - 90;
                        const rad = (angle * Math.PI) / 180;
                        const x1 = 100 + 70 * Math.cos(rad);
                        const y1 = 100 + 70 * Math.sin(rad);
                        const x2 = 100 + 80 * Math.cos(rad);
                        const y2 = 100 + 80 * Math.sin(rad);
                        return (
                          <line
                            key={mark}
                            x1={x1}
                            y1={y1}
                            x2={x2}
                            y2={y2}
                            stroke="hsl(var(--muted-foreground))"
                            strokeWidth="2"
                            opacity={0.5}
                          />
                        );
                      })}
                    </svg>
                    {/* Center value */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="text-center -mt-6">
                        <div className="text-3xl font-bold text-card-foreground">{formatNumber(totalFeatureActions)}</div>
                        <div className="text-xs text-muted-foreground mt-1">Total Actions</div>
                      </div>
                    </div>
                  </div>
                  {/* Feature list */}
                  <div className="mt-4 space-y-2 w-full">
                    {featureData.map((item, index) => {
                      const percentage = Math.round((item.value / totalFeatureActions) * 100);
                      return (
                        <div key={index} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                            <span className="text-muted-foreground">{item.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{ 
                                  width: `${percentage}%`,
                                  backgroundColor: item.color 
                                }}
                              />
                            </div>
                            <span className="text-card-foreground font-medium w-10 text-right">{percentage}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
