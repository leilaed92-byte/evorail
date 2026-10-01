<?php

namespace App\Providers;

use App\Models\Approval;
use App\Models\Document;
use App\Models\DocumentRevision;
use App\Models\Project;
use App\Models\Review;
use App\Models\ReviewComment;
use App\Models\Transmission;
use App\Policies\ApprovalPolicy;
use App\Policies\DocumentPolicy;
use App\Policies\ProjectPolicy;
use App\Policies\ReviewPolicy;
use App\Policies\RevisionPolicy;
use App\Policies\TransmissionPolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;

class AuthServiceProvider extends ServiceProvider
{
    protected $policies = [
        Project::class => ProjectPolicy::class,
        Document::class => DocumentPolicy::class,
        DocumentRevision::class => RevisionPolicy::class,
        Review::class => ReviewPolicy::class,
        ReviewComment::class => ReviewPolicy::class,
        Transmission::class => TransmissionPolicy::class,
        Approval::class => ApprovalPolicy::class,
    ];

    public function boot(): void
    {
        $this->registerPolicies();
    }
}
