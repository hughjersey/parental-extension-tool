<?php

use App\Http\Controllers\Api\ActivationCodeController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\DeviceController;
use App\Http\Controllers\Api\WatchEventController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Public routes (no authentication required)
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Device activation (no auth required - uses activation code)
Route::post('/devices/activate', [DeviceController::class, 'activate']);

// Protected routes (require authentication)
Route::middleware('auth:sanctum')->group(function () {
    // Auth
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);

    // Activation Codes
    Route::get('/activation-codes', [ActivationCodeController::class, 'index']);
    Route::post('/activation-codes', [ActivationCodeController::class, 'generate']);
    Route::delete('/activation-codes/{id}', [ActivationCodeController::class, 'destroy']);

    // Devices
    Route::get('/devices', [DeviceController::class, 'index']);
    Route::post('/devices/heartbeat', [DeviceController::class, 'heartbeat']);
    Route::delete('/devices/{id}', [DeviceController::class, 'destroy']);

    // Watch Events
    Route::get('/watch-events', [WatchEventController::class, 'index']);
    Route::post('/watch-events', [WatchEventController::class, 'store']);
    Route::post('/watch-events/batch', [WatchEventController::class, 'storeBatch']);

    // Dashboard
    Route::get('/dashboard/stats', [DashboardController::class, 'stats']);
    Route::get('/dashboard/overview', [DashboardController::class, 'overview']);
});
