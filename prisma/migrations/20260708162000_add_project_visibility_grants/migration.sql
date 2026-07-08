CREATE TABLE "ProjectVisibilityGrant" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "projectId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectVisibilityGrant_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProjectVisibilityGrant_userId_projectId_key" ON "ProjectVisibilityGrant"("userId", "projectId");
CREATE INDEX "ProjectVisibilityGrant_userId_idx" ON "ProjectVisibilityGrant"("userId");
CREATE INDEX "ProjectVisibilityGrant_projectId_idx" ON "ProjectVisibilityGrant"("projectId");

ALTER TABLE "ProjectVisibilityGrant"
    ADD CONSTRAINT "ProjectVisibilityGrant_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProjectVisibilityGrant"
    ADD CONSTRAINT "ProjectVisibilityGrant_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
