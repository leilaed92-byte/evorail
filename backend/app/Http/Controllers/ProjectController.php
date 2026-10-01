<?php

namespace App\Http\Controllers;

use App\Http\Resources\ProjectResource;
use App\Models\Project;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class ProjectController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user()->load('memberships');
        $projects = $user->projects()
            ->with('organization')
            ->wherePivot('status', 'active')
            ->orderBy('projects.name')
            ->get();

        return ApiResponse::data($request, [
            'items' => ProjectResource::collection($projects)->resolve($request),
        ]);
    }

    public function show(Request $request, Project $project): JsonResponse
    {
        Gate::authorize('view', $project);
        $project->load('organization');

        return ApiResponse::data($request, ['project' => ProjectResource::make($project)->resolve($request)]);
    }
}
