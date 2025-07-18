import { getProfileByUsername, getUserLikedPosts, getUserPosts, isFollowing } from "@/actions/profile.action";
import ProfilePageClient from "./ProfilePageClient";
import { notFound } from "next/navigation";

export async function generateMetadata({params}:{params: Promise<{username:string}>}){
   const resolvedParams = await params;
    const user = await getProfileByUsername(resolvedParams?.username)
    if(!user) return;
    return{
        title:`${user.name ?? user.username}`,
        description:`${user.bio ?? "No bio available"}`,
    }   
}


const ProfileServer = async({params}:{params: Promise<{username:string}>}) =>{
    const resolvedParams = await params;
    const user = await getProfileByUsername(resolvedParams?.username)
    if(!user) return notFound()
   
    const [posts,likedPosts,isCurrentUserFollowing] = await Promise.all([
        getUserPosts(user?.id || ""),
        getUserLikedPosts(user?.id || ""),
        isFollowing(user?.id || "")
    ])


    return (
       <ProfilePageClient 
       user={user}
         posts={posts}
            likedPosts={likedPosts}
            isFollowing={isCurrentUserFollowing}
       
       />
    );
}
export default ProfileServer;