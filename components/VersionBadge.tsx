'use client';

import { useEffect, useState } from 'react';

interface VersionInfo {
  commitHash: string;
  commitDate: string;
  branch: string;
  buildTime: string;
  version: string;
}

export function VersionBadge() {
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/version.json')
      .then(res => {
        if (!res.ok) {
          throw new Error('Failed to load version info');
        }
        return res.json();
      })
      .then(data => {
        setVersionInfo(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load version info:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return null;
  }

  if (!versionInfo) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-800/90 backdrop-blur-sm rounded-lg px-3 py-2 text-xs text-gray-400 border border-gray-700 z-50">
      <div className="flex items-center gap-2">
        <span className="text-gray-500">v{versionInfo.version}</span>
        <span className="text-gray-600">|</span>
        <span className="font-mono">{versionInfo.commitHash}</span>
      </div>
      <div className="text-gray-500 mt-1">
        {new Date(versionInfo.buildTime).toLocaleString('zh-CN')}
      </div>
    </div>
  );
}
