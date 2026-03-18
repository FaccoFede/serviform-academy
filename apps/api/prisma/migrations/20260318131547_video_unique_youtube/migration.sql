/*
  Warnings:

  - A unique constraint covering the columns `[youtubeId]` on the table `VideoPill` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "VideoPill_youtubeId_key" ON "VideoPill"("youtubeId");
