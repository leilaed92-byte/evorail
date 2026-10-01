<?php

use App\Http\Middleware\AttachRequestId;
use App\Support\ApiResponse;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        api: __DIR__.'/../routes/api.php',
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        apiPrefix: 'api',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->statefulApi();
        $middleware->redirectGuestsTo(fn (Request $request): ?string => $request->is('api/*') ? null : '/');
        $middleware->append(AttachRequestId::class);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );
        $exceptions->render(function (AuthenticationException $exception, Request $request): mixed {
            return $request->is('api/*') ? ApiResponse::error($request, 'Unauthenticated.', 401, [], 'unauthenticated') : null;
        });
        $exceptions->render(function (AuthorizationException $exception, Request $request): mixed {
            return $request->is('api/*') ? ApiResponse::error($request, 'This action is unauthorized.', 403, [], 'forbidden') : null;
        });
        $exceptions->render(function (ModelNotFoundException $exception, Request $request): mixed {
            return $request->is('api/*') ? ApiResponse::error($request, 'Resource not found.', 404, [], 'not_found') : null;
        });
        $exceptions->render(function (ValidationException $exception, Request $request): mixed {
            return $request->is('api/*') ? ApiResponse::error($request, 'The given data was invalid.', 422, $exception->errors(), 'validation_failed') : null;
        });
        $exceptions->render(function (HttpException $exception, Request $request): mixed {
            if (! $request->is('api/*')) {
                return null;
            }

            $status = $exception->getStatusCode();
            $code = match ($status) {
                401 => 'unauthenticated',
                403 => 'forbidden',
                404 => 'not_found',
                default => null,
            };

            return $code === null ? null : ApiResponse::error($request, $exception->getMessage() ?: 'Request failed.', $status, [], $code);
        });
    })->create();
