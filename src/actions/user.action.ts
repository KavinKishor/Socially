"use server"

import { prisma } from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache";

export async function syncUser() {
    try {
        const {userId} = await auth()
        const user = await currentUser()
        if (!userId || !user) return;
        //check if user exists in the database
        const existingUser = await prisma.user.findUnique({
            where:{
                clerkId:userId
            }
        })

        if (existingUser) return existingUser;
        //if user does not exist, create a new user

        const dbUser = await prisma.user.create({
            data:{
                clerkId:userId,
                name: `${user.firstName || ""} ${user.lastName || ""}`,
                username: user.username || user.emailAddresses[0].emailAddress.split("@")[0],
                email:user.emailAddresses[0].emailAddress,
                image:user.imageUrl || ""
            }
        })

        return dbUser;
    } catch (error:any) {
        console.error("Error syncing user:", error.message);
    }
}

export async function getUserByClerkId(clerkId:string){
   return await prisma.user.findUnique({
    where:{clerkId},
    include:{
        _count:{
            select:{
                followers:true,
                following:true,
                post:true
            }
        }
    }
   })
}

export async function getDbUserId(){
    const {userId:clerkId} = await auth()
    if(!clerkId) return null; // or throw new Error("UnAuthorized")
        
    const user = await getUserByClerkId(clerkId)
    if(!user) throw new Error("User not found")
    return user.id        
}
export async function getRandomUsers(){
    try {
        const userId = await getDbUserId()
        if (!userId) return []; // if user is not logged in, return empty array
//get 3 random user ad excluding the ourselves as well user already followed
        const randomusers = await prisma.user.findMany({
            where:{
                AND:[
                    {NOT:{id:userId}},
                    {NOT:{followers:{some:{followerId:userId}}}}
                ]
            },
            select:{
                id:true,
                name:true,
                username:true,
                image:true,
                _count:{
                    select:{
                        followers:true
                    }
                }
            },
            take:3,
        })
        // revalidatePath('/')
        return randomusers;
    } catch (error) {
        console.error("Error fetching random users:", error)
        return [];
        
    }
}
export async function toggleFollow(targetUserId:string){
    
    try {
        const userId = await getDbUserId()
        if (!userId) return;
        if(userId === targetUserId) throw new Error("You cannot follow yourself")
        
        const existingFollow = await prisma.follows.findUnique({
            where:{
                followerId_followingId:{
                    followerId:userId,
                    followingId:targetUserId
                }
            }
        })  
        if (existingFollow){
            //unfollow the user
            await prisma.follows.delete({
                where:{
                    followerId_followingId:{
                        followerId:userId,
                        followingId:targetUserId
                    }
                }
            })
        } else{
            //follow the user
            await prisma.$transaction([
                prisma.follows.create({
                    data:{
                        followerId:userId,
                        followingId:targetUserId
                    }
                }),
                prisma.notification.create({
                    data:{
                        type:'FOLLOW',
                        userId:targetUserId, // the user being followed
                        creatorId:userId // the user who followed (current user)
                    }
                })

            ])
        } 
        revalidatePath('/')
        return {success:true, message: existingFollow ? "Unfollowed successfully" : "Followed successfully"}
    } catch (error) {
        console.error("Error toggling follow:", error)
        return {success:false, message:error instanceof Error ? error.message : "Something went wrong"}
    }
}