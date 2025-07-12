"use server"

import { prisma } from "@/lib/prisma";
import { getDbUserId } from "./user.action"
import { revalidatePath } from "next/cache";

export async function createPost(content:string,imageUrl:string){
    try {
        const userId = await getDbUserId()
        if(!userId) return;

        const post = await prisma.post.create({
            data:{
                content,
                image: imageUrl || null,
                authorId: userId,
            }
        })
        revalidatePath('/')//purge the cache for the home page
        
        return {success:true,post}
    } catch (error) {
        console.error("Error creating post:", error);
        return {success:false,error:"Failed to create post. Please try again."}
    }
}

export async function getPosts(){
    try {
        const posts = await prisma.post.findMany({
            orderBy:{
                createdAt:'desc'
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
           
        })
        return posts;
    } catch (error) {
        console.error("Error fetching posts:", error);
        throw new Error("Failed to fetch posts. Please try again.");
        
    }
}

export async function toggleLike(postId:string){
    try {

        const userId = await getDbUserId()
        if (!userId) return;
        //check the like already exists
        const existingLike = await prisma.like.findUnique({
            where:{
                userId_postId:{
                    userId,
                    postId
                }
            }
        })

        const post = await prisma.post.findUnique({
            where:{id:postId},
            select:{authorId:true}
        })
        if(!post) throw new Error("Post not found");

        if(existingLike){
            //if it exists, delete the like
            await prisma.like.delete({
                where:{
                    userId_postId:{
                        userId,
                        postId
                    }
                }
            })}else{
                //if it doesn't exist, create a new like
                await prisma.$transaction([
                    prisma.like.create({
                        data:{
                            userId,
                            postId
                        }
                    }),
                    ...(post.authorId !== userId ? [
                        prisma.notification.create({
                            data:{
                                type:'Like',
                                userId:post.authorId, // Notify the post author
                                creatorId:userId, // The user who liked the post
                                postId
                            }
                        })
                    ]:[])

                ])
            }

            revalidatePath('/')
            return {success:true}

    } catch (error) {
        console.error("Error toggling like:", error);
        return {success:false,error:"Failed to toggle like. Please try again."}

    }
}

export async function createComment(postId:string,content:string){
    try {
        const userId = await getDbUserId()
        if(!userId) return;
        if(!content) throw new Error("Comment content cannot be empty");

        const post = await prisma.post.findUnique({
            where:{id:postId},
            select:{authorId:true}
        })
        if(!post) throw new Error("Post not found");

        //create a comment with array of comments
        const [comment] = await prisma.$transaction(async(tx)=>{
            // Create the comment
            const newComment = await tx.comment.create({
                data:{
                    content,
                    postId,
                    authorId:userId
                }
            })
            // Create a notification if commenting on someone else's post
            if(post.authorId ! == userId){
                await tx.notification.create({
                    data:{
                        type:'COMMENT',
                        userId:post.authorId, // Notify the post author
                        creatorId:userId, // The user who commented
                        postId,
                        commentId:newComment.id // Include the comment ID
                    }
                })
            }
            return [newComment];
        })

        revalidatePath('/') 
        return {success:true,comment}

    } catch (error) {
        console.error("Error creating comment:", error);
        return {success:false,error:"Failed to create comment. Please try again."}
    }
}

export async function deletePost(postId:string){
    try {
        const userId = await getDbUserId()
        if(!userId) return;

        const post = await prisma.post.findUnique({
            where:{id:postId},
            select:{authorId:true}
        })

        if(!post) throw new Error("Post not found");

        if(post.authorId !== userId) throw new Error("You are not authorized to delete this post");

        await prisma.post.delete({
            where:{id:postId}
        })

        revalidatePath('/')
        return {success:true}
    } catch (error) {
        console.error("Error deleting post:", error);
        return {success:false,error:"Failed to delete post. Please try again."}
    }
}