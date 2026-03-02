/*
  Warnings:

  - You are about to drop the `Collection` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CollectionItem` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Comment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Like` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MediaItem` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Collection" DROP CONSTRAINT "Collection_userId_fkey";

-- DropForeignKey
ALTER TABLE "CollectionItem" DROP CONSTRAINT "CollectionItem_collectionId_fkey";

-- DropForeignKey
ALTER TABLE "CollectionItem" DROP CONSTRAINT "CollectionItem_mediaItemId_fkey";

-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_collectionId_fkey";

-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_userId_fkey";

-- DropForeignKey
ALTER TABLE "Like" DROP CONSTRAINT "Like_collectionId_fkey";

-- DropForeignKey
ALTER TABLE "Like" DROP CONSTRAINT "Like_userId_fkey";

-- DropTable
DROP TABLE "Collection";

-- DropTable
DROP TABLE "CollectionItem";

-- DropTable
DROP TABLE "Comment";

-- DropTable
DROP TABLE "Like";

-- DropTable
DROP TABLE "MediaItem";

-- CreateTable
CREATE TABLE "collections" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "slug" TEXT NOT NULL,
    "category" "Category" NOT NULL DEFAULT 'MIXED',
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "collections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collection_items" (
    "id" TEXT NOT NULL,
    "status" "ItemStatus" NOT NULL DEFAULT 'PLANNED',
    "rating" INTEGER,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "collection_id" TEXT NOT NULL,
    "media_item_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "collection_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_items" (
    "id" TEXT NOT NULL,
    "external_id" TEXT NOT NULL,
    "type" "Category" NOT NULL,
    "title" TEXT NOT NULL,
    "poster_url" TEXT,
    "metadata" JSONB NOT NULL,

    CONSTRAINT "media_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "likes" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "collection_id" TEXT NOT NULL,

    CONSTRAINT "likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comments" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "collection_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "collections_slug_key" ON "collections"("slug");

-- CreateIndex
CREATE INDEX "collections_user_id_idx" ON "collections"("user_id");

-- CreateIndex
CREATE INDEX "collection_items_collection_id_idx" ON "collection_items"("collection_id");

-- CreateIndex
CREATE INDEX "collection_items_media_item_id_idx" ON "collection_items"("media_item_id");

-- CreateIndex
CREATE UNIQUE INDEX "collection_items_collection_id_media_item_id_key" ON "collection_items"("collection_id", "media_item_id");

-- CreateIndex
CREATE UNIQUE INDEX "media_items_external_id_key" ON "media_items"("external_id");

-- CreateIndex
CREATE INDEX "likes_user_id_idx" ON "likes"("user_id");

-- CreateIndex
CREATE INDEX "likes_collection_id_idx" ON "likes"("collection_id");

-- CreateIndex
CREATE UNIQUE INDEX "likes_user_id_collection_id_key" ON "likes"("user_id", "collection_id");

-- CreateIndex
CREATE INDEX "comments_user_id_idx" ON "comments"("user_id");

-- CreateIndex
CREATE INDEX "comments_collection_id_idx" ON "comments"("collection_id");

-- AddForeignKey
ALTER TABLE "collections" ADD CONSTRAINT "collections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collection_items" ADD CONSTRAINT "collection_items_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "collections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collection_items" ADD CONSTRAINT "collection_items_media_item_id_fkey" FOREIGN KEY ("media_item_id") REFERENCES "media_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "likes" ADD CONSTRAINT "likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "likes" ADD CONSTRAINT "likes_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "collections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "collections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
