'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle, MapPin, Clock, RefreshCw } from 'lucide-react';
import { formatDateTime, getSeverityColor, formatRegistrationNumber } from '@/lib/utils';

interface Alert {
  id: string;
  registrationNumber: string;
  severity: string;
  alertTime: string;
  isAcknowledged: boolean;
  acknowledgedAt?: string;
  notes?: string;
  cameraId: string;
  cameraName: string;
  cameraLocation: string;
  watchlistReason: string;
  watchlistCaseRef?: string;
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [acknowledging, setAcknowledging] = useState<string | null>(null);

  const fetchAlerts = async () => {
    try {
      const response = await fetch('/api/alerts');
      const data = await response.json();
      setAlerts(data.alerts || []);
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    
    // Poll for new alerts every 10 seconds
    const interval = setInterval(fetchAlerts, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleAcknowledge = async (alertId: string) => {
    setAcknowledging(alertId);
    try {
      const response = await fetch(`/api/alerts/${alertId}/acknowledge`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: 'Acknowledged by officer' }),
      });
      
      if (response.ok) {
        // Refresh alerts
        await fetchAlerts();
      }
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    } finally {
      setAcknowledging(null);
    }
  };

  const unacknowledged = alerts.filter(a => !a.isAcknowledged);
  const acknowledged = alerts.filter(a => a.isAcknowledged);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 text-slate-400 animate-spin mx-auto" />
          <p className="text-sm text-slate-600 mt-2">Loading alerts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Alerts</h1>
          <p className="text-sm text-slate-600 mt-1">
            Watchlist vehicle detection notifications
          </p>
        </div>
        <button
          onClick={fetchAlerts}
          className="flex items-center gap-2 rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200">
          <p className="text-sm text-slate-600">Total Alerts</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{alerts.length}</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-red-200 bg-red-50">
          <p className="text-sm text-red-600 font-medium">Pending</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{unacknowledged.length}</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200">
          <p className="text-sm text-slate-600">Acknowledged</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{acknowledged.length}</p>
        </div>
      </div>

      {/* Unacknowledged Alerts */}
      {unacknowledged.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-red-200">
          <div className="border-b border-red-200 bg-red-50 px-6 py-3">
            <h2 className="text-sm font-semibold text-red-900 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Pending Alerts ({unacknowledged.length})
            </h2>
          </div>
          <div className="divide-y divide-slate-200">
            {unacknowledged.map((alert) => (
              <div key={alert.id} className="px-6 py-4 hover:bg-slate-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium uppercase ${getSeverityColor(alert.severity)}`}>
                        {alert.severity}
                      </span>
                      <span className="font-mono font-bold text-lg text-slate-900">
                        {formatRegistrationNumber(alert.registrationNumber)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">
                      <strong>Reason:</strong> {alert.watchlistReason}
                    </p>
                    {alert.watchlistCaseRef && (
                      <p className="text-sm text-slate-600">
                        <strong>Case:</strong> {alert.watchlistCaseRef}
                      </p>
                    )}
                    <div className="mt-2 flex items-center gap-4 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {alert.cameraId} - {alert.cameraLocation}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {formatDateTime(alert.alertTime)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAcknowledge(alert.id)}
                    disabled={acknowledging === alert.id}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {acknowledging === alert.id ? 'Processing...' : 'Acknowledge'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Acknowledged Alerts */}
      {acknowledged.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200">
          <div className="border-b border-slate-200 bg-slate-50 px-6 py-3">
            <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Acknowledged Alerts ({acknowledged.length})
            </h2>
          </div>
          <div className="divide-y divide-slate-200">
            {acknowledged.map((alert) => (
              <div key={alert.id} className="px-6 py-4 opacity-60">
                <div className="flex items-center gap-3">
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium uppercase ${getSeverityColor(alert.severity)}`}>
                    {alert.severity}
                  </span>
                  <span className="font-mono font-medium text-slate-900">
                    {formatRegistrationNumber(alert.registrationNumber)}
                  </span>
                  <span className="text-sm text-slate-500">
                    {alert.cameraId} - {formatDateTime(alert.alertTime)}
                  </span>
                  {alert.acknowledgedAt && (
                    <span className="text-xs text-green-600">
                      ✓ {formatDateTime(alert.acknowledgedAt)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {alerts.length === 0 && (
        <div className="bg-white rounded-lg p-12 shadow-sm border border-slate-200">
          <div className="text-center">
            <AlertTriangle className="mx-auto h-16 w-16 text-slate-300" />
            <h3 className="mt-4 text-lg font-medium text-slate-900">No alerts</h3>
            <p className="mt-2 text-sm text-slate-600">
              Alerts will appear when watchlist vehicles are detected
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
