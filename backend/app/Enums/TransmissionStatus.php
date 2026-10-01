<?php

namespace App\Enums;

enum TransmissionStatus: string
{
    case Draft = 'draft';
    case Issued = 'issued';
    case Cancelled = 'cancelled';
}
