<?php
declare(strict_types=1);

if (!defined('DB_NAME')) {
    throw new RuntimeException('DB constants must be defined before loading schema_helpers.');
}

/**
 * Ellenőrzi, hogy létezik-e a users táblában a megadott oszlop.
 */
function usersColumnExists(mysqli $db, string $column): bool
{
    static $cache = [];
    if (array_key_exists($column, $cache)) {
        return $cache[$column];
    }

    $schema = DB_NAME;
    $stmt = $db->prepare('SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = "users" AND COLUMN_NAME = ? LIMIT 1');
    $stmt->bind_param('ss', $schema, $column);
    $stmt->execute();
    $stmt->store_result();
    $exists = $stmt->num_rows > 0;
    $stmt->close();

    $cache[$column] = $exists;
    return $exists;
}

/**
 * Biztosítja, hogy létezzen a megadott oszlop, szükség esetén létrehozza.
 */
function ensureUsersColumn(mysqli $db, string $column, string $definition): void
{
    if (usersColumnExists($db, $column)) {
        return;
    }

    $db->query("ALTER TABLE users ADD COLUMN {$column} {$definition}");
}
