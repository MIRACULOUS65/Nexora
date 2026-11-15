"use server";

import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";

export async function checkUser(){
    const clerkUser = await currentUser();
    if(!clerkUser) return null;

    try {
        const existing = await prisma.user.findUnique({
            where:{clerkId: clerkUser.id},
        });

        if(existing) return existing;

        const email = clerkUser.emailAddresses[0]?.emailAddress;
        if(!email) return null;


        return prisma.user.create({
            data:{
                clerkId: clerkUser.id,
                email,
                name:
                `${clerkUser.firstName??""} ${clerkUser.lastName??""}`.trim()||null,
                imageUrl: clerkUser.imageUrl,
            },
        });
    } catch (error) {
        const code =
            typeof error === "object" && error && "code" in error
                ? String((error as { code?: string }).code)
                : "";

        if (code === "ETIMEDOUT") {
            return null;
        }

        throw error;
    }
}