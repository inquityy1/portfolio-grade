-- CreateTable
CREATE TABLE "public"."Alive" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Alive_pkey" PRIMARY KEY ("id")
);
