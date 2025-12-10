-- CreateEnum
CREATE TYPE "AgreementStatus" AS ENUM ('agreed', 'declined', 'pending');

-- CreateEnum
CREATE TYPE "InteractionType" AS ENUM ('PANGGILAN_TELEPON', 'CATATAN_INTERNAL');

-- CreateEnum
CREATE TYPE "CallResult" AS ENUM ('success', 'failure', 'no_answer', 'unknown');

-- CreateTable
CREATE TABLE "User" (
    "id" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255),
    "phone" VARCHAR(255),
    "passwordHash" VARCHAR(255) NOT NULL,
    "role" VARCHAR(50) NOT NULL DEFAULT 'Sales',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" VARCHAR(255) NOT NULL,
    "token" VARCHAR(255) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "userId" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(255),
    "address" TEXT,
    "age" INTEGER NOT NULL,
    "job" VARCHAR(50) NOT NULL DEFAULT 'unknown',
    "marital" VARCHAR(50) NOT NULL DEFAULT 'unknown',
    "education" VARCHAR(50) NOT NULL DEFAULT 'unknown',
    "default" VARCHAR(20) NOT NULL DEFAULT 'unknown',
    "balance" REAL NOT NULL,
    "housing" VARCHAR(20) NOT NULL DEFAULT 'unknown',
    "loan" VARCHAR(20) NOT NULL DEFAULT 'unknown',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" VARCHAR(255) NOT NULL,
    "contact" VARCHAR(50) NOT NULL DEFAULT 'unknown',
    "day_of_week" VARCHAR(50) NOT NULL DEFAULT 'unknown',
    "month" VARCHAR(50) NOT NULL DEFAULT 'unknown',
    "campaign" INTEGER NOT NULL,
    "previous" INTEGER NOT NULL,
    "pdays" INTEGER NOT NULL,
    "poutcome" VARCHAR(50) NOT NULL DEFAULT 'unknown',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "customerId" VARCHAR(255) NOT NULL,
    "userId" VARCHAR(255),
    "finalDecision" "AgreementStatus",

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MacroData" (
    "id" VARCHAR(255) NOT NULL,
    "month" VARCHAR(50) NOT NULL,
    "emp_var_rate" REAL NOT NULL,
    "cons_price_idx" REAL NOT NULL,
    "cons_conf_idx" REAL NOT NULL,
    "euribor3m" REAL NOT NULL,
    "nr_employed" REAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MacroData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadScore" (
    "id" VARCHAR NOT NULL,
    "customerId" VARCHAR NOT NULL,
    "campaignId" VARCHAR NOT NULL,
    "predicted_y" VARCHAR,
    "score" DOUBLE PRECISION,
    "threshold" DOUBLE PRECISION,
    "model_version" VARCHAR,
    "batch_id" VARCHAR,
    "createdAt" TIMESTAMP(6),

    CONSTRAINT "LeadScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InteractionLog" (
    "id" VARCHAR(255) NOT NULL,
    "type" "InteractionType" NOT NULL DEFAULT 'CATATAN_INTERNAL',
    "note" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "customerId" VARCHAR(255) NOT NULL,
    "userId" VARCHAR(255),
    "callResult" "CallResult" DEFAULT 'unknown',

    CONSTRAINT "InteractionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leadscore" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "customerid" VARCHAR NOT NULL,
    "campaignid" VARCHAR NOT NULL,
    "predicted_y" VARCHAR NOT NULL,
    "score" DOUBLE PRECISION,
    "createdat" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leadscore_pkey" PRIMARY KEY ("id")
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
CREATE INDEX "ix_LeadScore_batch_id" ON "LeadScore"("batch_id");

-- CreateIndex
CREATE INDEX "ix_LeadScore_id" ON "LeadScore"("id");

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
ALTER TABLE "LeadScore" ADD CONSTRAINT "LeadScore_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadScore" ADD CONSTRAINT "LeadScore_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InteractionLog" ADD CONSTRAINT "InteractionLog_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InteractionLog" ADD CONSTRAINT "InteractionLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leadscore" ADD CONSTRAINT "fk_campaign" FOREIGN KEY ("campaignid") REFERENCES "Campaign"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leadscore" ADD CONSTRAINT "fk_customer" FOREIGN KEY ("customerid") REFERENCES "Customer"("id") ON DELETE NO ACTION ON UPDATE CASCADE;
