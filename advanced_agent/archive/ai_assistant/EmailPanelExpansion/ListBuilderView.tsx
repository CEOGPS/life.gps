"use client";

export default function ListBuilderView() {
  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-semibold">List Builder + Verification</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8">
          <h3 className="font-medium mb-4">Import / Scrape Sources</h3>
          <p className="text-zinc-500">LinkedIn • Zoom • CSV • Manual</p>
        </div>
        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8">
          <h3 className="font-medium mb-4">Bulk Email Verification</h3>
          <p className="text-zinc-500">0 emails queued for verification</p>
        </div>
      </div>
    </div>
  );
}
