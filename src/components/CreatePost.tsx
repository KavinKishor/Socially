"use client"

import { useUser } from '@clerk/nextjs'
import React,{useState} from 'react'
import { Card, CardContent } from './ui/card'
import { Avatar, AvatarImage } from './ui/avatar'
import { Textarea } from './ui/textarea'
import { Button } from './ui/button'
import { ImageIcon, Loader2Icon, SendIcon } from 'lucide-react'
import toast from 'react-hot-toast'
import { createPost } from '@/actions/post.action'
import ImageUpload from './ImageUpload'

const CreatePost = () => {
  const {user} = useUser()
  const [content, setContent] = useState<string>("")
  const [imageUrl,setImageUrl] = useState<string>("")
  const [isPosting,setIsPosting] =useState<boolean>(false)
  const [showImageUpload,setShowImageUpload] = useState<boolean>(false)

  const handleSubmit = async () =>{

    try {
      if(!content.trim() && !imageUrl) return;
      setIsPosting(true)

      const result = await createPost(
        content,
        imageUrl,
      )

      if(result?.success){
        setContent("")
        setImageUrl('')
        setShowImageUpload(false)
        toast.success("post created successfully !")
      }
      
    } catch (error) {
      console.error("Error creating post:", error)
      toast.error("Failed to create post. Please try again.")
      
    }
    finally {
      setIsPosting(false)
    }
  }

  return (
   
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex space-x-4">
            <Avatar className="w-10 h-10">
              <AvatarImage src={user?.imageUrl || "/avatar.png"} />
            </Avatar>
              <Textarea
              placeholder="What's on your mind?"
              className="min-h-[100px] resize-none border-none focus-visible:ring-0 p-0 text-base"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={isPosting}
            />
          </div>
{/* image upload section*/}

{(showImageUpload || imageUrl) && (
  <div className="border rounded-4 p-4">
    <ImageUpload
    endpoint = "postImage"
    value={imageUrl}
    onChange={(url) => {
      setImageUrl(url);
      if (!url) setShowImageUpload(false); // Hide upload section if no image
    }}
    />
  </div>
)}
          {/* post section  */}
            <div className="flex items-center justify-between border-t pt-4">
            <div className="flex space-x-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-primary"
                onClick={() => setShowImageUpload(!showImageUpload)}
                disabled={isPosting}
              >
                <ImageIcon className="size-4 mr-2" />
                Photo
              </Button>
            </div>
            <Button
              className="flex items-center"
              onClick={handleSubmit}
              disabled={(!content.trim() && !imageUrl) || isPosting}
            >
              {isPosting ? (
                <>
                  <Loader2Icon className="size-4 mr-2 animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  <SendIcon className="size-4 mr-2" />
                  Post
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
    
  )
}

export default CreatePost