<?php

namespace App\Enums;

enum SuitabilityStatus: string
{
    case ForInformation = 'for_information';
    case ForReview = 'for_review';
    case ForApproval = 'for_approval';
    case Approved = 'approved';
    case IssuedForConstruction = 'issued_for_construction';
    case AsBuilt = 'as_built';
}
