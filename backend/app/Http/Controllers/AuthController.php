<?php

namespace App\Http\Controllers;

use App\Http\Requests\LoginRequest;
use App\Http\Resources\UserResource;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    public function login(LoginRequest $request): JsonResponse
    {
        $credentials = $request->only('email', 'password');

        if (! Auth::attempt($credentials, (bool) $request->boolean('remember'))) {
            return ApiResponse::error($request, 'The provided credentials are incorrect.', 401, [], 'invalid_credentials');
        }

        $request->session()->regenerate();
        $user = $request->user()->load(['memberships', 'projects.organization']);

        return ApiResponse::data($request, ['user' => UserResource::make($user)->resolve($request)]);
    }

    public function logout(Request $request): JsonResponse
    {
        Auth::guard('web')->logout();
        Auth::forgetGuards();
        $request->session()->flush();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return ApiResponse::data($request, ['logged_out' => true]);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load(['memberships', 'projects.organization']);

        return ApiResponse::data($request, ['user' => UserResource::make($user)->resolve($request)]);
    }
}
