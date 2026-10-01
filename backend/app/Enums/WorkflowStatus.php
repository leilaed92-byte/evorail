<?php

namespace App\Enums;

enum WorkflowStatus: string
{
    case Draft = 'draft';
    case Submitted = 'submitted';
    case UnderReview = 'under_review';
    case Returned = 'returned';
    case Resubmitted = 'resubmitted';
    case Completed = 'completed';
}
