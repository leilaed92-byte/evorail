<?php

use App\Http\Controllers\ApprovalController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DocumentController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\ReviewController;
use App\Http\Controllers\RevisionController;
use App\Http\Controllers\TransmissionController;
use Illuminate\Support\Facades\Route;

Route::middleware('throttle:api')->group(function (): void {
    Route::get('/me', [AuthController::class, 'me'])->middleware('auth:sanctum');
    Route::get('/projects', [ProjectController::class, 'index'])->middleware('auth:sanctum');
    Route::get('/projects/{project}', [ProjectController::class, 'show'])->middleware('auth:sanctum');
    Route::get('/projects/{project}/documents', [DocumentController::class, 'index'])->middleware('auth:sanctum');
    Route::get('/documents/{document}', [DocumentController::class, 'show'])->middleware('auth:sanctum');
    Route::get('/documents/{document}/activity', [DocumentController::class, 'activity'])->middleware('auth:sanctum');
    Route::get('/documents/{document}/revisions', [RevisionController::class, 'index'])->middleware('auth:sanctum');
    Route::post('/documents/{document}/revisions', [RevisionController::class, 'store'])->middleware('auth:sanctum');
    Route::get('/revisions/{revision}', [RevisionController::class, 'show'])->middleware('auth:sanctum');
    Route::get('/revisions/{revision}/preview', [RevisionController::class, 'preview'])->middleware('auth:sanctum');
    Route::get('/revisions/{revision}/download', [RevisionController::class, 'download'])->middleware('auth:sanctum');
    Route::get('/revisions/{revision}/compare/{otherRevision}', [RevisionController::class, 'compare'])->middleware('auth:sanctum');
    Route::get('/projects/{project}/reviews', [ReviewController::class, 'index'])->middleware('auth:sanctum');
    Route::get('/reviews/{review}', [ReviewController::class, 'show'])->middleware('auth:sanctum');
    Route::post('/documents/{document}/reviews', [ReviewController::class, 'store'])->middleware('auth:sanctum');
    Route::post('/reviews/{review}/comments', [ReviewController::class, 'comment'])->middleware('auth:sanctum');
    Route::post('/reviews/{review}/start', [ReviewController::class, 'start'])->middleware('auth:sanctum');
    Route::post('/reviews/{review}/complete', [ReviewController::class, 'complete'])->middleware('auth:sanctum');
    Route::post('/reviews/{review}/return', [ReviewController::class, 'return'])->middleware('auth:sanctum');
    Route::get('/projects/{project}/approvals', [ApprovalController::class, 'index'])->middleware('auth:sanctum');
    Route::get('/approvals/{approval}', [ApprovalController::class, 'show'])->middleware('auth:sanctum');
    Route::post('/documents/{document}/approvals', [ApprovalController::class, 'store'])->middleware('auth:sanctum');
    Route::post('/approvals/{approval}/approve', [ApprovalController::class, 'approve'])->middleware('auth:sanctum');
    Route::post('/approvals/{approval}/reject', [ApprovalController::class, 'reject'])->middleware('auth:sanctum');
    Route::get('/projects/{project}/transmissions', [TransmissionController::class, 'index'])->middleware('auth:sanctum');
    Route::post('/projects/{project}/transmissions', [TransmissionController::class, 'store'])->middleware('auth:sanctum');
    Route::get('/transmissions/{transmission}', [TransmissionController::class, 'show'])->middleware('auth:sanctum');
    Route::patch('/transmissions/{transmission}', [TransmissionController::class, 'update'])->middleware('auth:sanctum');
    Route::post('/transmissions/{transmission}/recipients', [TransmissionController::class, 'addRecipient'])->middleware('auth:sanctum');
    Route::delete('/transmissions/{transmission}/recipients/{recipient}', [TransmissionController::class, 'removeRecipient'])->middleware('auth:sanctum');
    Route::post('/transmissions/{transmission}/items', [TransmissionController::class, 'addItem'])->middleware('auth:sanctum');
    Route::delete('/transmissions/{transmission}/items/{item}', [TransmissionController::class, 'removeItem'])->middleware('auth:sanctum');
    Route::post('/transmissions/{transmission}/issue', [TransmissionController::class, 'issue'])->middleware('auth:sanctum');
    Route::get('/transmissions/{transmission}/download', [TransmissionController::class, 'download'])->middleware('auth:sanctum');
});

Route::post('/login', [AuthController::class, 'login'])->middleware(['web', 'throttle:login']);
Route::post('/logout', [AuthController::class, 'logout'])->middleware(['web', 'auth:sanctum']);
