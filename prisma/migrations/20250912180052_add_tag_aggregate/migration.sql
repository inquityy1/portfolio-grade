-- CreateTable
CREATE TABLE "public"."TagAggregate" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TagAggregate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TagAggregate_organizationId_calculatedAt_idx" ON "public"."TagAggregate"("organizationId", "calculatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "TagAggregate_organizationId_tagId_key" ON "public"."TagAggregate"("organizationId", "tagId");
