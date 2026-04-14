<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

json_response([
    'canStart' => true,
    'message' => 'Server online'
]);