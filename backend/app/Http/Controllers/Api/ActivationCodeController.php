<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivationCode;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ActivationCodeController extends Controller
{
    /**
     * Generate a new activation code
     */
    public function generate(Request $request)
    {
        $validated = $request->validate([
            'expires_in_hours' => ['nullable', 'integer', 'min:1', 'max:168'], // Max 7 days
        ]);

        $expiresInHours = $validated['expires_in_hours'] ?? 24; // Default 24 hours

        // Generate unique 12-character code
        do {
            $code = strtoupper(Str::random(12));
        } while (ActivationCode::where('code', $code)->exists());

        $activationCode = ActivationCode::create([
            'user_id' => $request->user()->id,
            'code' => $code,
            'expires_at' => now()->addHours($expiresInHours),
        ]);

        return response()->json([
            'activation_code' => $activationCode,
            'message' => 'Activation code generated successfully',
        ], 201);
    }

    /**
     * List all activation codes for the authenticated user
     */
    public function index(Request $request)
    {
        $codes = $request->user()
            ->activationCodes()
            ->with('device')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($code) {
                return [
                    'id' => $code->id,
                    'code' => $code->code,
                    'expires_at' => $code->expires_at,
                    'used_at' => $code->used_at,
                    'device' => $code->device,
                    'is_valid' => $code->isValid(),
                    'is_expired' => $code->isExpired(),
                    'is_used' => $code->isUsed(),
                    'created_at' => $code->created_at,
                ];
            });

        return response()->json([
            'activation_codes' => $codes,
        ]);
    }

    /**
     * Delete an activation code
     */
    public function destroy(Request $request, $id)
    {
        $activationCode = $request->user()->activationCodes()->findOrFail($id);

        if ($activationCode->isUsed()) {
            return response()->json([
                'message' => 'Cannot delete a used activation code',
            ], 400);
        }

        $activationCode->delete();

        return response()->json([
            'message' => 'Activation code deleted successfully',
        ]);
    }
}
