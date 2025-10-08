-- CreateTable
CREATE TABLE "public"."wishlists" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wishlists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."wishlist_items" (
    "id" TEXT NOT NULL,
    "wishlist_id" TEXT NOT NULL,
    "item_type" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wishlist_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "wishlists_patient_id_key" ON "public"."wishlists"("patient_id");

-- AddForeignKey
ALTER TABLE "public"."wishlists" ADD CONSTRAINT "wishlists_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."wishlist_items" ADD CONSTRAINT "wishlist_items_wishlist_id_fkey" FOREIGN KEY ("wishlist_id") REFERENCES "public"."wishlists"("id") ON DELETE CASCADE ON UPDATE CASCADE;
