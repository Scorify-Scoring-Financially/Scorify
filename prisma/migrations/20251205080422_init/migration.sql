-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('Sales', 'Admin');

-- CreateEnum
CREATE TYPE "Job" AS ENUM ('admin', 'technician', 'services', 'management', 'retired', 'blue_collar', 'unemployed', 'entrepreneur', 'housemaid', 'self_employed', 'student', 'unknown');

-- CreateEnum
CREATE TYPE "MaritalStatus" AS ENUM ('married', 'single', 'divorced');

-- CreateEnum
CREATE TYPE "Education" AS ENUM ('basic_4y', 'basic_6y', 'basic_9y', 'high_school', 'university_degree', 'professional_course', 'unknown');

-- CreateEnum
CREATE TYPE "YesNoUnknown" AS ENUM ('yes', 'no', 'unknown');

-- CreateEnum
CREATE TYPE "AgreementStatus" AS ENUM ('agreed', 'declined', 'pending');

-- CreateEnum
CREATE TYPE "ContactType" AS ENUM ('cellular', 'telephone');

-- CreateEnum
CREATE TYPE "POutcome" AS ENUM ('nonexistent', 'failure', 'success');

-- CreateEnum
CREATE TYPE "Prediction" AS ENUM ('yes', 'no');

-- CreateEnum
CREATE TYPE "InteractionType" AS ENUM ('PANGGILAN_TELEPON', 'CATATAN_INTERNAL');

-- CreateEnum
CREATE TYPE "CallResult" AS ENUM ('success', 'failure', 'no_answer', 'unknown');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "phone" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'Sales',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
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
    "finalDecision" "AgreementStatus",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "customerId" TEXT NOT NULL,
    "userId" TEXT,

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

-- CreateTable
CREATE TABLE "InteractionLog" (
    "id" TEXT NOT NULL,
    "type" "InteractionType" NOT NULL,
    "note" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "customerId" TEXT NOT NULL,
    "userId" TEXT,
    "callResult" "CallResult",

    CONSTRAINT "InteractionLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "PasswordResetToken"("token");

-- CreateIndex
CREATE INDEX "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_email_key" ON "Customer"("email");

-- CreateIndex
CREATE INDEX "Customer_name_idx" ON "Customer"("name");

-- CreateIndex
CREATE INDEX "Customer_email_idx" ON "Customer"("email");

-- CreateIndex
CREATE INDEX "Campaign_customerId_idx" ON "Campaign"("customerId");

-- CreateIndex
CREATE INDEX "Campaign_userId_idx" ON "Campaign"("userId");

-- CreateIndex
CREATE INDEX "Campaign_month_idx" ON "Campaign"("month");

-- CreateIndex
CREATE UNIQUE INDEX "MacroData_month_key" ON "MacroData"("month");

-- CreateIndex
CREATE INDEX "LeadScore_customerId_idx" ON "LeadScore"("customerId");

-- CreateIndex
CREATE INDEX "LeadScore_campaignId_idx" ON "LeadScore"("campaignId");

-- CreateIndex
CREATE INDEX "LeadScore_score_idx" ON "LeadScore"("score");

-- CreateIndex
CREATE INDEX "InteractionLog_customerId_idx" ON "InteractionLog"("customerId");

-- CreateIndex
CREATE INDEX "InteractionLog_userId_idx" ON "InteractionLog"("userId");

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadScore" ADD CONSTRAINT "LeadScore_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadScore" ADD CONSTRAINT "LeadScore_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InteractionLog" ADD CONSTRAINT "InteractionLog_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InteractionLog" ADD CONSTRAINT "InteractionLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
