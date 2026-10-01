<?php

namespace App\Enums;

enum EffectiveState: string
{
    case Current = 'current';
    case Superseded = 'superseded';
    case Withdrawn = 'withdrawn';
    case Archived = 'archived';
}
