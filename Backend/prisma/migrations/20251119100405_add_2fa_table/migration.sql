-- CreateTable
CREATE TABLE "twoFA" (
    "userId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "method" TEXT NOT NULL,
    "secret" TEXT,
    "code" TEXT,
    "expiresAt" DATETIME,
    "destination" TEXT,
    CONSTRAINT "twoFA_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
