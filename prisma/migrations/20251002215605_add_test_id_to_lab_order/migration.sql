-- DropForeignKey
ALTER TABLE "public"."prescriptions" DROP CONSTRAINT "prescriptions_doctor_id_fkey";

-- AlterTable
ALTER TABLE "public"."lab_orders" ADD COLUMN     "test_id" TEXT,
ALTER COLUMN "package_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."prescriptions" ADD CONSTRAINT "prescription_doctor_user_fkey" FOREIGN KEY ("doctor_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."prescriptions" ADD CONSTRAINT "prescription_patient_user_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."prescriptions" ADD CONSTRAINT "prescription_doctor_profile_fkey" FOREIGN KEY ("doctor_id") REFERENCES "public"."doctor_profiles"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."lab_orders" ADD CONSTRAINT "lab_orders_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "public"."lab_packages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."lab_orders" ADD CONSTRAINT "lab_orders_test_id_fkey" FOREIGN KEY ("test_id") REFERENCES "public"."lab_tests"("id") ON DELETE SET NULL ON UPDATE CASCADE;
