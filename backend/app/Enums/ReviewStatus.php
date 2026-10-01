<?php

namespace App\Enums;

enum ReviewStatus: string
{
    case Open = 'open';
    case InProgress = 'in_progress';
    case Returned = 'returned';
    case Completed = 'completed';
    case Cancelled = 'cancelled';
}
