import { getPosts } from "@/actions/post.action";
import { getDbUserId } from "@/actions/user.action";
import CreatePost from "@/components/CreatePost";
import PostCard from "@/components/PostCard";
import WhotoFollow from "@/components/WhotoFollow";
import { currentUser } from "@clerk/nextjs/server";


export default  async function Home() {
  const user = await currentUser()
  const posts = await getPosts()
  const dbUserId = await getDbUserId()
  
  return (
  <>
  <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
      <div className="lg:col-span-6">
      {user ? (<CreatePost />) : null}


    { dbUserId ? <div className="space-y-6">
      {posts.map((post)=>(<PostCard key={post.id} post={post} dbUserId={dbUserId} />))}
    </div> : null} 
    </div>
    <div className="hidden lg:block lg:col-span-4 sticky top-20">
      {user && <WhotoFollow />}
    </div>
  </div>
  </>
  );
}
