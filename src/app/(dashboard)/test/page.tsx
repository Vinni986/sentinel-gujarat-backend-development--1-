'use client';

import { useState } from 'react';
import { Upload, CheckCircle, XCircle, AlertTriangle, Video, Image as ImageIcon } from 'lucide-react';

export default function TestPage() {
  const [file, setFile] = useState<File | null>(null);
  const [cameraId, setCameraId] = useState('CAM-001');
  const [mode, setMode] = useState<'image' | 'video'>('image');
  const [frameInterval, setFrameInterval] = useState('10');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('camera_id', cameraId);
    formData.append(mode === 'image' ? 'image' : 'video', file);

    if (mode === 'video') {
      formData.append('frame_interval', frameInterval);
    }

    try {
      const endpoint =
        mode === 'image'
          ? '/api/ai/process-frame'
          : '/api/ai/process-video';

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Processing failed');
      }

      setResult(data);
    } catch (error) {
      console.error(error);
      setError(error instanceof Error ? error.message : 'Processing failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          CCTV AI Detection
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Process traffic images or video using vehicle detection, ANPR and watchlist intelligence.
        </p>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-yellow-900">
              Python AI Service
            </h3>
            <p className="text-sm text-yellow-700 mt-1">
              AI service must be running on port 8000.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <div className="flex gap-2 mb-6">
          <button
            type="button"
            onClick={() => {
              setMode('image');
              setFile(null);
              setResult(null);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium ${
              mode === 'image'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            <ImageIcon className="h-4 w-4" />
            Image
          </button>

          <button
            type="button"
            onClick={() => {
              setMode('video');
              setFile(null);
              setResult(null);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium ${
              mode === 'video'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            <Video className="h-4 w-4" />
            CCTV Video
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Camera ID
            </label>

            <select
              value={cameraId}
              onChange={(e) => setCameraId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              {[...Array(50)].map((_, i) => {
                const id = `CAM-${(i + 1).toString().padStart(3, '0')}`;
                return (
                  <option key={id} value={id}>
                    {id}
                  </option>
                );
              })}
            </select>
          </div>

          {mode === 'video' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Process every Nth frame
              </label>

              <select
                value={frameInterval}
                onChange={(e) => setFrameInterval(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              >
                <option value="5">Every 5 frames — more accurate</option>
                <option value="10">Every 10 frames — recommended</option>
                <option value="15">Every 15 frames — faster</option>
                <option value="30">Every 30 frames — fastest</option>
              </select>

              <p className="text-xs text-slate-500 mt-1">
                Frame sampling reduces CPU usage while still demonstrating continuous CCTV analysis.
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {mode === 'image' ? 'Traffic Image' : 'CCTV Video'}
            </label>

            <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
              {file ? (
                <div className="space-y-3">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto" />

                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {file.name}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="text-sm text-blue-600"
                  >
                    Choose different file
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {mode === 'image' ? (
                    <Upload className="h-12 w-12 text-slate-400 mx-auto" />
                  ) : (
                    <Video className="h-12 w-12 text-slate-400 mx-auto" />
                  )}

                  <label className="cursor-pointer">
                    <span className="text-sm text-blue-600 font-medium">
                      Choose file
                    </span>

                    <input
                      type="file"
                      accept={mode === 'image' ? 'image/*' : 'video/*'}
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                  </label>

                  <p className="text-xs text-slate-500">
                    {mode === 'image'
                      ? 'PNG, JPG up to 10MB'
                      : 'MP4, AVI, MOV and other browser-supported video formats'}
                  </p>
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={!file || loading}
            className="w-full bg-blue-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {mode === 'video'
                  ? 'Processing CCTV Video...'
                  : 'Processing Frame...'}
              </span>
            ) : (
              mode === 'video' ? 'Process CCTV Video' : 'Process Frame'
            )}
          </button>
        </form>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <XCircle className="h-5 w-5 text-red-600" />
            <div>
              <h3 className="text-sm font-semibold text-red-900">
                Processing Failed
              </h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4 shadow-sm border">
              <p className="text-sm text-slate-600">Vehicles Detected</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                {result.detections || result.totalDetections || 0}
              </p>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-sm border">
              <p className="text-sm text-slate-600">Saved</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {result.savedCount || result.detections || 0}
              </p>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-sm border">
              <p className="text-sm text-slate-600">Alerts</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {result.alerts || 0}
              </p>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-sm border">
              <p className="text-sm text-slate-600">Frames Processed</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">
                {result.framesProcessed || 1}
              </p>
            </div>
          </div>

          {result.saved && result.saved.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-slate-200">
              <div className="border-b px-6 py-4">
                <h3 className="text-lg font-semibold text-slate-900">
                  Detection Intelligence
                </h3>
              </div>

              <div className="divide-y">
                {result.saved.map((detection: any, index: number) => (
                  <div key={index} className="px-6 py-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
                            Vehicle: {detection.vehicleType?.toUpperCase()}
                          </span>

                          {detection.plate && (
                            <span className="font-mono font-bold text-lg text-slate-900">
                              Plate: {detection.plate}
                            </span>
                          )}

                          {detection.alertCreated && (
                            <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-bold text-red-700">
                              🚨 WATCHLIST MATCH
                            </span>
                          )}
                        </div>

                        {detection.alertCreated && (
                          <div className="mt-3 rounded-lg bg-red-50 border border-red-200 p-3">
                            <p className="text-sm font-semibold text-red-900">
                              Automated Alert Generated
                            </p>

                            {detection.alertSeverity && (
                              <p className="text-sm text-red-700 mt-1">
                                Severity: {detection.alertSeverity.toUpperCase()}
                              </p>
                            )}

                            {detection.alertReason && (
                              <p className="text-sm text-red-700 mt-1">
                                Reason: {detection.alertReason}
                              </p>
                            )}
                          </div>
                        )}

                        <div className="mt-3 text-xs text-slate-500">
                          Detection ID: {detection.detectionId}
                          {detection.plateDetectionId && (
                            <span className="ml-4">
                              Plate ID: {detection.plateDetectionId}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <details className="bg-white rounded-lg shadow-sm border">
            <summary className="px-6 py-4 cursor-pointer font-medium">
              View Raw Response
            </summary>

            <div className="border-t px-6 py-4">
              <pre className="bg-slate-50 p-4 rounded text-xs overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          </details>
        </div>
      )}
    </div>
  );
}
