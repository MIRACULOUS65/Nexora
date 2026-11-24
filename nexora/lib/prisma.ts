import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/lib/generated/prisma/client"

const globalForPrisma = global as unknown as {prisma: PrismaClient};

// The app uses the pooled URL (Supabase transaction pooler, port 6543), so many serverless
// instances share a small set of real Postgres connections. DIRECT_URL is only for migrations
// (see prisma.config.ts). max keeps each instance from opening more than a few connections.
const adapter = new PrismaPg({
	connectionString: process.env.DATABASE_URL,
	max: 5,
});

export const prisma = globalForPrisma.prisma || new PrismaClient({adapter});

if(process.env.NODE_ENV !=="production") globalForPrisma.prisma= prisma;
