import { useParams } from "react-router-dom";
import BlogPostForm from "@/components/blog/BlogPostForm";

const EditBlogPostPage = () => {
  const { id } = useParams<{ id: string }>();

  if (!id) {
    return (
      <div className="container p-6">
        <h1 className="text-3xl font-bold tracking-tight">Error</h1>
        <p className="text-muted-foreground">
          Blog post ID is missing. Cannot edit post.
        </p>
      </div>
    );
  }

  return (
    <div className="container p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Edit Blog Post</h1>
        <p className="text-muted-foreground">
          Make changes to your existing blog post
        </p>
      </div>

      <BlogPostForm postId={id} isEditing={true} />
    </div>
  );
};

export default EditBlogPostPage;
