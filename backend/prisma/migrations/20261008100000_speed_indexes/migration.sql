-- Composite indexes for the hottest read paths; they replace single-column indexes they fully cover.
-- DropIndex
DROP INDEX "Term_chapterId_idx";
DROP INDEX "Test_chapterId_idx";
DROP INDEX "TestQuestion_testId_idx";
DROP INDEX "TestResult_studentId_idx";

-- CreateIndex
CREATE INDEX "Term_chapterId_name_idx" ON "Term"("chapterId", "name");
CREATE INDEX "Test_chapterId_createdAt_idx" ON "Test"("chapterId", "createdAt");
CREATE INDEX "TestQuestion_testId_order_idx" ON "TestQuestion"("testId", "order");
CREATE INDEX "TestResult_studentId_submittedAt_idx" ON "TestResult"("studentId", "submittedAt");
CREATE INDEX "TestResult_submittedAt_idx" ON "TestResult"("submittedAt");
CREATE INDEX "StudentProgress_termId_idx" ON "StudentProgress"("termId");
