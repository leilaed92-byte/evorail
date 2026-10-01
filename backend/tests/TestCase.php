<?php

namespace Tests;

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use RuntimeException;

abstract class TestCase extends BaseTestCase
{
    public function createApplication(): Application
    {
        $app = parent::createApplication();
        $connection = $app->make('db')->connection();

        if ($connection->getDriverName() === 'pgsql' && ! str_ends_with($connection->getDatabaseName(), '_test')) {
            throw new RuntimeException('PostgreSQL tests require a separate database ending in _test; refusing to refresh the development database.');
        }

        return $app;
    }
}
