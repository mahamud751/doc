/*
  Warnings:

  - You are about to drop the column `tests_included` on the `lab_packages` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."lab_packages" DROP COLUMN "tests_included";

-- CreateTable
CREATE TABLE "public"."lab_tests" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "sample_type" TEXT NOT NULL,
    "preparation_required" BOOLEAN NOT NULL DEFAULT false,
    "preparation_instructions" TEXT,
    "reporting_time" TEXT NOT NULL,
    "normal_range" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lab_tests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."lab_package_tests" (
    "id" TEXT NOT NULL,
    "package_id" TEXT NOT NULL,
    "test_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lab_package_tests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "lab_tests_name_key" ON "public"."lab_tests"("name");

-- CreateIndex
CREATE UNIQUE INDEX "lab_tests_code_key" ON "public"."lab_tests"("code");

-- CreateIndex
CREATE UNIQUE INDEX "lab_package_tests_package_id_test_id_key" ON "public"."lab_package_tests"("package_id", "test_id");

-- AddForeignKey
ALTER TABLE "public"."lab_package_tests" ADD CONSTRAINT "lab_package_tests_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "public"."lab_packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."lab_package_tests" ADD CONSTRAINT "lab_package_tests_test_id_fkey" FOREIGN KEY ("test_id") REFERENCES "public"."lab_tests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
