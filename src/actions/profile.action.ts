"use server"

import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { getDbUserId } from "./user.action";


export async function getProfileByUsername(username:string){
    try {
        const user = await prisma.user.findUnique({
            where:{username},
            select:{
                id:true,
                name:true,
                username:true,
                image:true,
                bio:true,
                website:true,
                location:true,
                createdAt:true,
                _count:{
                    select:{
                        followers:true,
                        following:true,
                        post:true,
                    }
                }

            }
        })
        return user
    } catch (error) {
        console.log("Error fetching profile:", error);
        return null;
    }
}

export async function getUserPosts(userId:string){

    try {
        const posts = await prisma.post.findMany({
            where:{
                authorId:userId
            },
            include:{
                author:{
                    select:{
                        id:true,
                        name:true,
                        username:true,
                        image:true
                    }
                },
                comments:{
                    include:{
                        author:{
                            select:{
                                id:true,
                                name:true,
                                username:true,
                                image:true
                            }
                        }
                    },
                    orderBy:{
                        createdAt:'asc'
                    }
                },
                likes:{
                    select:{
                        userId:true
                    }
                },
                _count:{
                    select:{
                        comments:true,
                        likes:true
                    }
                }
            },
            orderBy:{
                createdAt:'desc'
            }
        })
        return posts;
    } catch (error) {
       console.error("Error fetching user posts:", error);
       return [];
    }
}

export async function getUserLikedPosts(userId:string){
    try {
        const likedPosts = await prisma.post.findMany({
            where:{
                likes:{
                    some:{
                        userId
                    }
                }
            },
            include:{
                author:{
                    select:{
                        id:true,
                        name:true,
                        username:true,
                        image:true
                    }
                },
                comments:{
                    include:{
                        author:{
                            select:{
                                id:true,
                                name:true,
                                username:true,
                                image:true
                            }
                        }
                    },
                    orderBy:{
                        createdAt:'asc'
                    }
                },
                likes:{
                    select:{
                        userId:true
                    }
                },
                _count:{
                    select:{
                        comments:true,
                        likes:true
                    }
                }
            },
            orderBy:{
                createdAt:'desc'
            }
        })
        return likedPosts;
    } catch (error) {
        console.error("Error fetching liked posts:", error);
        return [];
    }
}   

export async function updateProfile(formData:FormData) {

    try {
        const {userId : clerkId} = await auth()
        if(!clerkId) throw new Error("User not authenticated");

        const name = formData.get("name") as string;
        const bio = formData.get("bio") as string;
        const website = formData.get("website") as string;
        const location = formData.get("location") as string;

        const user = await prisma.user.update({
            where:{clerkId},
            data:{
                name,
                bio,
                website,
                location
            }
        })
        revalidatePath('/profile')
        return {success:true, user}
    } catch (error) {
        console.error("Error updating profile:", error);
        return {success:false, error:"Failed to update profile"}
    }
    
}

export async function isFollowing(userId:string){
    try {
        const currentUserId = await getDbUserId()
        if(!currentUserId) return false;

        const follows = await prisma.follows.findUnique({
            where:{
                followerId_followingId:{
                    followerId:currentUserId,
                    followingId:userId
                }
            }
        })

        return !!follows
    } catch (error) {
        console.error("Error checking follow status:", error);
        return false;
    }
}