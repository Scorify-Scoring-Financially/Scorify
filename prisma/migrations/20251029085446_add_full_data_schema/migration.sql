-- CreateEnum
CREATE TYPE "Job" AS ENUM ('admin', 'technician', 'services', 'management', 'retired', 'blue_collar', 'unemployed', 'entrepreneur', 'housemaid', 'self_employed', 'student', 'unknown');

-- CreateEnum
CREATE TYPE "MaritalStatus" AS ENUM ('married', 'single', 'divorced');

-- CreateEnum
CREATE TYPE "Education" AS ENUM ('basic_4y', 'basic_6y', 'basic_9y', 'high_school', 'university_degree', 'professional_course', 'unknown');

-- CreateEnum
CREATE TYPE "YesNoUnknown" AS ENUM ('yes', 'no', 'unknown');

-- CreateEnum
CREATE TYPE "ContactType" AS ENUM ('cellular', 'telephone');

-- CreateEnum
CREATE TYPE "POutcome" AS ENUM ('nonexistent', 'failure', 'success');

-- CreateEnum
CREATE TYPE "Prediction" AS ENUM ('yes', 'no');

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "job" "Job" NOT NULL,
    "marital" "MaritalStatus" NOT NULL,
    "education" "Education" NOT NULL,
    "default" "YesNoUnknown" NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL,
    "housing" "YesNoUnknown" NOT NULL,
    "loan" "YesNoUnknown" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "contact" "ContactType" NOT NULL,
    "day_of_week" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "campaign" INTEGER NOT NULL,
    "previous" INTEGER NOT NULL,
    "pdays" INTEGER NOT NULL,
    "poutcome" "POutcome" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "customerId" TEXT NOT NULL,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MacroData" (
    "id" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "emp_var_rate" DOUBLE PRECISION NOT NULL,
    "cons_price_idx" DOUBLE PRECISION NOT NULL,
    "cons_conf_idx" DOUBLE PRECISION NOT NULL,
    "euribor3m" DOUBLE PRECISION NOT NULL,
    "nr_employed" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MacroData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadScore" (
    "id" TEXT NOT NULL,
    "predicted_y" "Prediction" NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "customerId" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,

    CONSTRAINT "LeadScore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Campaign_customerId_idx" ON "Campaign"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "MacroData_month_key" ON "MacroData"("month");

-- CreateIndex
CREATE INDEX "LeadScore_customerId_idx" ON "LeadScore"("customerId");

-- CreateIndex
CREATE INDEX "LeadScore_campaignId_idx" ON "LeadScore"("campaignId");

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadScore" ADD CONSTRAINT "LeadScore_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadScore" ADD CONSTRAINT "LeadScore_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
