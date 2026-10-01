<?php

namespace App\Support;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class ApiResponse
{
    /** @param array<string, mixed> $data */
    public static function data(Request $request, array $data, int $status = 200): JsonResponse
    {
        return response()->json([
            'data' => $data,
            'request_id' => $request->attributes->get('request_id'),
        ], $status);
    }

    /** @param array<string, mixed> $errors */
    public static function error(Request $request, string $message, int $status, array $errors = [], ?string $code = null): JsonResponse
    {
        return response()->json([
            'message' => $message,
            'code' => $code,
            'errors' => $errors,
            'request_id' => $request->attributes->get('request_id'),
        ], $status);
    }
}
