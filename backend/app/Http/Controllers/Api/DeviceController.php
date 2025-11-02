<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivationCode;
use App\Models\Device;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class DeviceController extends Controller
{
    /**
     * Activate a device using an activation code
     */
    public function activate(Request $request)
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'size:12'],
            'device_uuid' => ['required', 'string', 'max:255'],
            'name' => ['nullable', 'string', 'max:255'],
            'browser_type' => ['nullable', 'string', 'max:255'],
            'browser_version' => ['nullable', 'string', 'max:255'],
            'os' => ['nullable', 'string', 'max:255'],
        ]);

        $activationCode = ActivationCode::where('code', $validated['code'])->first();

        if (!$activationCode) {
            return response()->json([
                'message' => 'Invalid activation code',
            ], 404);
        }

        if (!$activationCode->isValid()) {
            return response()->json([
                'message' => $activationCode->isExpired()
                    ? 'Activation code has expired'
                    : 'Activation code has already been used',
            ], 400);
        }

        // Check if device already exists
        $device = Device::where('device_uuid', $validated['device_uuid'])->first();

        if ($device) {
            // Re-activate existing device
            $device->update([
                'is_active' => true,
                'activated_at' => now(),
                'last_seen_at' => now(),
            ]);
        } else {
            // Create new device
            $device = Device::create([
                'user_id' => $activationCode->user_id,
                'device_uuid' => $validated['device_uuid'],
                'name' => $validated['name'] ?? 'Browser Extension',
                'browser_type' => $validated['browser_type'],
                'browser_version' => $validated['browser_version'],
                'os' => $validated['os'],
                'activated_at' => now(),
                'last_seen_at' => now(),
                'is_active' => true,
            ]);
        }

        // Mark code as used
        $activationCode->update([
            'device_id' => $device->id,
            'used_at' => now(),
        ]);

        // Create device token
        $token = $device->user->createToken('device-token-' . $device->id)->plainTextToken;

        return response()->json([
            'device' => $device,
            'token' => $token,
            'message' => 'Device activated successfully',
        ], 200);
    }

    /**
     * Update device heartbeat
     */
    public function heartbeat(Request $request)
    {
        $validated = $request->validate([
            'device_uuid' => ['required', 'string'],
        ]);

        $device = Device::where('device_uuid', $validated['device_uuid'])->first();

        if (!$device) {
            return response()->json([
                'message' => 'Device not found',
            ], 404);
        }

        $device->update([
            'last_seen_at' => now(),
        ]);

        return response()->json([
            'message' => 'Heartbeat updated',
            'device' => $device,
        ]);
    }

    /**
     * List all devices for the authenticated user
     */
    public function index(Request $request)
    {
        $devices = $request->user()
            ->devices()
            ->withCount('watchEvents')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'devices' => $devices,
        ]);
    }

    /**
     * Delete/deactivate a device
     */
    public function destroy(Request $request, $id)
    {
        $device = $request->user()->devices()->findOrFail($id);

        $device->update([
            'is_active' => false,
        ]);

        return response()->json([
            'message' => 'Device deactivated successfully',
        ]);
    }
}
