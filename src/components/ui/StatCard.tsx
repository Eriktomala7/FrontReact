import React from 'react';
import { ArrowUpIcon, ArrowDownIcon, MinusIcon } from '@heroicons/react/20/solid';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: string | number;
    type: 'increase' | 'decrease' | 'neutral';
    label: string;
  };
  className?: string;
  iconBgColor?: string;
}

const trendIcons = {
  increase: ArrowUpIcon,
  decrease: ArrowDownIcon,
  neutral: MinusIcon,
};

const trendColors = {
  increase: 'text-green-600 bg-green-100',
  decrease: 'text-red-600 bg-red-100',
  neutral: 'text-gray-600 bg-gray-100',
};

export function StatCard({
  title,
  value,
  icon,
  trend,
  className = '',
  iconBgColor = 'bg-blue-500',
}: StatCardProps) {
  const TrendIcon = trend ? trendIcons[trend.type] : null;

  return (
    <div className={`bg-white overflow-hidden shadow rounded-lg ${className}`}>
      <div className="p-5">
        <div className="flex items-center">
          <div className={`flex-shrink-0 rounded-md p-3 ${iconBgColor} text-white`}>
            {icon}
          </div>
          <div className="ml-5 w-0 flex-1">
            <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
            <dd className="flex items-baseline">
              <div className="text-2xl font-semibold text-gray-900">{value}</div>
              {trend && TrendIcon && (
                <div
                  className={`ml-2 flex items-baseline text-sm font-semibold ${trendColors[trend.type]} rounded-full px-2.5 py-0.5`}
                >
                  <TrendIcon className="-ml-1 mr-0.5 h-4 w-4 flex-shrink-0 self-center" />
                  <span className="sr-only">
                    {trend.type === 'increase' ? 'Aumentó' : trend.type === 'decrease' ? 'Disminuyó' : 'Sin cambios'}{' '}
                    por
                  </span>
                  {trend.value}
                </div>
              )}
            </dd>
            {trend?.label && <div className="text-xs text-gray-500 mt-1">{trend.label}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default StatCard;
