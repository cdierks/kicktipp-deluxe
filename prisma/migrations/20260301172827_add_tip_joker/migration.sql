-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Tip" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "homeScore" INTEGER NOT NULL,
    "awayScore" INTEGER NOT NULL,
    "points" INTEGER,
    "isJoker" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Tip_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Tip_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Tip" ("awayScore", "homeScore", "id", "matchId", "points", "userId") SELECT "awayScore", "homeScore", "id", "matchId", "points", "userId" FROM "Tip";
DROP TABLE "Tip";
ALTER TABLE "new_Tip" RENAME TO "Tip";
CREATE UNIQUE INDEX "Tip_userId_matchId_key" ON "Tip"("userId", "matchId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
