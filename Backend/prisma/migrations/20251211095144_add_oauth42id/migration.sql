-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_users" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "oauth42Id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OFFLINE',
    "avatar" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isTwoFAEnabled" BOOLEAN NOT NULL DEFAULT false,
    "twoFAMethod" TEXT,
    "twoFAdestination" TEXT
);
INSERT INTO "new_users" ("avatar", "createdAt", "email", "id", "isTwoFAEnabled", "password", "status", "twoFAMethod", "twoFAdestination", "username") SELECT "avatar", "createdAt", "email", "id", "isTwoFAEnabled", "password", "status", "twoFAMethod", "twoFAdestination", "username" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_oauth42Id_key" ON "users"("oauth42Id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
