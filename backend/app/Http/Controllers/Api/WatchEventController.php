<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Device;
use App\Models\WatchEvent;
use Illuminate\Http\Request;

class WatchEventController extends Controller
{
    /**
     * Store a new watch event (real-time push from extension)
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'device_uuid' => ['required', 'string'],
            'video_id' => ['required', 'string', 'max:255'],
            'video_title' => ['nullable', 'string', 'max:255'],
            'channel_name' => ['nullable', 'string', 'max:255'],
            'channel_id' => ['nullable', 'string', 'max:255'],
            'video_url' => ['required', 'url', 'max:500'],
            'duration_seconds' => ['nullable', 'integer', 'min:0'],
            'watch_duration_seconds' => ['nullable', 'integer', 'min:0'],
            'watched_at' => ['nullable', 'date'],
            'thumbnail_url' => ['nullable', 'url'],
            'metadata' => ['nullable', 'array'],
        ]);

        // Find device by UUID
        $device = Device::where('device_uuid', $validated['device_uuid'])->first();

        if (!$device) {
            return response()->json([
                'message' => 'Device not found. Please activate your device first.',
            ], 404);
        }

        if (!$device->is_active) {
            return response()->json([
                'message' => 'Device is not active.',
            ], 403);
        }

        // Create watch event
        $watchEvent = WatchEvent::create([
            'device_id' => $device->id,
            'video_id' => $validated['video_id'],
            'video_title' => $validated['video_title'],
            'channel_name' => $validated['channel_name'],
            'channel_id' => $validated['channel_id'],
            'video_url' => $validated['video_url'],
            'duration_seconds' => $validated['duration_seconds'],
            'watch_duration_seconds' => $validated['watch_duration_seconds'],
            'watched_at' => $validated['watched_at'] ?? now(),
            'thumbnail_url' => $validated['thumbnail_url'],
            'metadata' => $validated['metadata'],
        ]);

        // Update device last_seen_at
        $device->update([
            'last_seen_at' => now(),
        ]);

        return response()->json([
            'message' => 'Watch event recorded successfully',
            'watch_event' => $watchEvent,
        ], 201);
    }

    /**
     * Batch store multiple watch events
     */
    public function storeBatch(Request $request)
    {
        $validated = $request->validate([
            'device_uuid' => ['required', 'string'],
            'events' => ['required', 'array', 'min:1', 'max:100'], // Max 100 events per batch
            'events.*.video_id' => ['required', 'string', 'max:255'],
            'events.*.video_title' => ['nullable', 'string', 'max:255'],
            'events.*.channel_name' => ['nullable', 'string', 'max:255'],
            'events.*.channel_id' => ['nullable', 'string', 'max:255'],
            'events.*.video_url' => ['required', 'url', 'max:500'],
            'events.*.duration_seconds' => ['nullable', 'integer', 'min:0'],
            'events.*.watch_duration_seconds' => ['nullable', 'integer', 'min:0'],
            'events.*.watched_at' => ['nullable', 'date'],
            'events.*.thumbnail_url' => ['nullable', 'url'],
            'events.*.metadata' => ['nullable', 'array'],
        ]);

        $device = Device::where('device_uuid', $validated['device_uuid'])->first();

        if (!$device) {
            return response()->json([
                'message' => 'Device not found.',
            ], 404);
        }

        if (!$device->is_active) {
            return response()->json([
                'message' => 'Device is not active.',
            ], 403);
        }

        $watchEvents = [];
        foreach ($validated['events'] as $eventData) {
            $watchEvents[] = WatchEvent::create([
                'device_id' => $device->id,
                'video_id' => $eventData['video_id'],
                'video_title' => $eventData['video_title'] ?? null,
                'channel_name' => $eventData['channel_name'] ?? null,
                'channel_id' => $eventData['channel_id'] ?? null,
                'video_url' => $eventData['video_url'],
                'duration_seconds' => $eventData['duration_seconds'] ?? null,
                'watch_duration_seconds' => $eventData['watch_duration_seconds'] ?? null,
                'watched_at' => $eventData['watched_at'] ?? now(),
                'thumbnail_url' => $eventData['thumbnail_url'] ?? null,
                'metadata' => $eventData['metadata'] ?? null,
            ]);
        }

        $device->update([
            'last_seen_at' => now(),
        ]);

        return response()->json([
            'message' => count($watchEvents) . ' watch events recorded successfully',
            'count' => count($watchEvents),
        ], 201);
    }

    /**
     * Get watch events for authenticated user
     */
    public function index(Request $request)
    {
        $query = WatchEvent::whereHas('device', function ($q) use ($request) {
            $q->where('user_id', $request->user()->id);
        })->with('device');

        // Filter by device
        if ($request->has('device_id')) {
            $query->where('device_id', $request->device_id);
        }

        // Filter by date range
        if ($request->has('from')) {
            $query->where('watched_at', '>=', $request->from);
        }

        if ($request->has('to')) {
            $query->where('watched_at', '<=', $request->to);
        }

        // Search by video title or channel name
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('video_title', 'like', "%{$search}%")
                  ->orWhere('channel_name', 'like', "%{$search}%");
            });
        }

        $watchEvents = $query->orderBy('watched_at', 'desc')
            ->paginate($request->get('per_page', 20));

        return response()->json($watchEvents);
    }
}
