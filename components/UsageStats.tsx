'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';

interface UsageData {
  has_subscription: boolean;
  projects_count: number;
  projects_limit: number;
  files_count: number;
  files_limit: number;
  conversations_count: number;
  conversations_limit: number;
  messages_count: number;
  messages_limit: number;
}

export default function UsageStats() {
  const { user } = useAuth();
  const { hasActive, subscription } = useSubscription();
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUsage = async () => {
      if (!user) return;

      try {
        const response = await fetch('/api/usage-stats');
        if (response.ok) {
          const data = await response.json();
          setUsage(data);
        }
      } catch (error) {
        console.error('Error fetching usage stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsage();
  }, [user, hasActive]);

  if (isLoading || !usage) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Usage Statistics</h3>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  const getUsagePercentage = (current: number, limit: number) => {
    if (limit === -1) return 0; // Unlimited
    return Math.min((current / limit) * 100, 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const UsageBar = ({ label, current, limit }: { label: string; current: number; limit: number }) => {
    const percentage = getUsagePercentage(current, limit);
    const isUnlimited = limit === -1;

    return (
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">{label}</span>
          <span className="font-medium">
            {current}{isUnlimited ? '' : ` / ${limit}`}
            {isUnlimited && <span className="text-green-600 ml-1">∞</span>}
          </span>
        </div>
        {!isUnlimited && (
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${getUsageColor(percentage)}`}
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Usage Statistics</h3>
        {hasActive && (
          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
            Premium
          </span>
        )}
        {!hasActive && subscription?.status === 'trialing' && (
          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
            Trial
          </span>
        )}
      </div>

      <div className="space-y-4">
        <UsageBar 
          label="Projects" 
          current={usage.projects_count} 
          limit={usage.projects_limit} 
        />
        <UsageBar 
          label="Files" 
          current={usage.files_count} 
          limit={usage.files_limit} 
        />
        <UsageBar 
          label="Conversations" 
          current={usage.conversations_count} 
          limit={usage.conversations_limit} 
        />
        <UsageBar 
          label="Messages" 
          current={usage.messages_count} 
          limit={usage.messages_limit} 
        />
      </div>

      {!hasActive && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700">
            Upgrade to Premium for unlimited access to all features.
          </p>
        </div>
      )}
    </div>
  );
}
