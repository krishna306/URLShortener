-- CreateTable
CREATE TABLE "Click" (
    "id" TEXT NOT NULL,
    "shortCode" TEXT NOT NULL,
    "clickedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "referrer" TEXT,
    "userAgent" TEXT,
    "ipAddress" TEXT,

    CONSTRAINT "Click_pkey" PRIMARY KEY ("id")
);
