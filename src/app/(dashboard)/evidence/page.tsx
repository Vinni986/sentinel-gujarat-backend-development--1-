import { FileText, Image, Video as VideoIcon } from 'lucide-react';

export default function EvidencePage() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Evidence</h1>
        <p className="text-sm text-slate-600 mt-1">
          Captured images and videos from detections
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200">
          <p className="text-sm text-slate-600">Total Evidence</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">0</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200">
          <p className="text-sm text-slate-600">Images</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">0</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200">
          <p className="text-sm text-slate-600">Videos</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">0</p>
        </div>
      </div>

      {/* Empty State */}
      <div className="bg-white rounded-lg p-12 shadow-sm border border-slate-200">
        <div className="text-center">
          <FileText className="mx-auto h-16 w-16 text-slate-300" />
          <h3 className="mt-4 text-lg font-medium text-slate-900">No evidence</h3>
          <p className="mt-2 text-sm text-slate-600">
            Evidence will be collected from vehicle detections
          </p>
        </div>
      </div>
    </div>
  );
}
