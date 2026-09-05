'use client';

import { useState } from 'react';
import { Search, Car, MapPin, Clock, Map, AlertCircle } from 'lucide-react';
import { formatDateTime, formatRelativeTime, formatRegistrationNumber } from '@/lib/utils';

export default function VehiclesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const plate = searchQuery.replace(/[^A-Z0-9]/gi, '').toUpperCase();
      const response = await fetch(`/api/vehicles/${plate}`);
      
      if (!response.ok) {
        throw new Error('Search failed');
      }
      
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error(error);
      setError(error instanceof Error ? error.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Vehicle Intelligence</h1>
        <p className="text-sm text-slate-600 mt-1">
          Search and track vehicles across the camera network
        </p>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg p-8 shadow-sm border border-slate-200">
        <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Search Vehicle by Registration Number
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Enter registration number (e.g., GJ 01 AB 1234)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
                className="w-full rounded-lg border border-slate-300 bg-white py-3 pl-12 pr-4 text-base focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Search for any vehicle detected in the camera network
          </p>
        </form>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-semibold text-red-900">Search Failed</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {results && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200">
              <p className="text-sm text-slate-600">Registration</p>
              <p className="text-xl font-bold text-slate-900 mt-1 font-mono">
                {formatRegistrationNumber(results.registrationNumber)}
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200">
              <p className="text-sm text-slate-600">Total Detections</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                {results.total}
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200">
              <p className="text-sm text-slate-600">First Seen</p>
              <p className="text-sm text-slate-900 mt-1">
                {results.vehicle?.firstSeenAt
                  ? formatRelativeTime(results.vehicle.firstSeenAt)
                  : results.detections[results.detections.length - 1]?.detectionTime
                  ? formatRelativeTime(results.detections[results.detections.length - 1].detectionTime)
                  : '—'}
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200">
              <p className="text-sm text-slate-600">Last Seen</p>
              <p className="text-sm text-slate-900 mt-1">
                {results.vehicle?.lastSeenAt
                  ? formatRelativeTime(results.vehicle.lastSeenAt)
                  : results.detections[0]?.detectionTime
                  ? formatRelativeTime(results.detections[0].detectionTime)
                  : '—'}
              </p>
            </div>
          </div>

          {results.total === 0 ? (
            <div className="bg-white rounded-lg p-12 shadow-sm border border-slate-200">
              <div className="text-center">
                <Car className="mx-auto h-16 w-16 text-slate-300" />
                <h3 className="mt-4 text-lg font-medium text-slate-900">No detections found</h3>
                <p className="mt-2 text-sm text-slate-600">
                  This vehicle has not been detected in the camera network yet
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Detection List */}
              <div className="bg-white rounded-lg shadow-sm border border-slate-200">
                <div className="border-b border-slate-200 px-6 py-4">
                  <h2 className="text-lg font-semibold text-slate-900">
                    Detection History ({results.total})
                  </h2>
                </div>
                <div className="divide-y divide-slate-200">
                  {results.detections.map((detection: any) => (
                    <div key={detection.id} className="px-6 py-4 hover:bg-slate-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <Car className="h-5 w-5 text-slate-400" />
                            <span className="font-medium text-slate-900 uppercase">
                              {detection.vehicleType}
                            </span>
                            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                              {(parseFloat(detection.confidence) * 100).toFixed(0)}% confident
                            </span>
                            {detection.plateConfidence && (
                              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                                Plate: {(parseFloat(detection.plateConfidence) * 100).toFixed(0)}%
                              </span>
                            )}
                          </div>
                          <div className="mt-2 flex items-center gap-4 text-sm text-slate-600">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {detection.cameraId} - {detection.cameraLocation}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {formatDateTime(detection.detectionTime)}
                            </span>
                          </div>
                        </div>
                        {detection.imagePath && (
                          <button className="text-sm text-blue-600 hover:text-blue-700">
                            View Evidence
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* View Route Button */}
              {results.total > 1 && (
                <div className="text-center">
                  <button className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700">
                    <Map className="h-5 w-5" />
                    View Route on Map ({results.total} locations)
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Empty State (Initial) */}
      {!results && !error && !loading && (
        <div className="bg-white rounded-lg p-12 shadow-sm border border-slate-200">
          <div className="text-center">
            <Car className="mx-auto h-16 w-16 text-slate-300" />
            <h3 className="mt-4 text-lg font-medium text-slate-900">No search yet</h3>
            <p className="mt-2 text-sm text-slate-600">
              Enter a vehicle registration number to view detection history
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
