CREATE TABLE "PasswordChangeRateLimit" (
    "userId" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "resetAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PasswordChangeRateLimit_pkey" PRIMARY KEY ("userId")
);
