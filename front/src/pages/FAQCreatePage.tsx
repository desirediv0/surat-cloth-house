import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { createFaq } from "@/api/faqService";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

export default function FAQCreatePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const initialData = location.state?.formData || {
    question: "",
    answer: "",
    category: "",
    order: 0,
    isPublished: true,
  };

  const [formData, setFormData] = useState(initialData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSwitchChange = (checked: boolean) => {
    setFormData({
      ...formData,
      isPublished: checked,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate required fields
      if (!formData.question.trim() || !formData.answer.trim()) {
        toast.error("Question and answer are required fields");
        setIsSubmitting(false);
        return;
      }

      await createFaq(formData);
      toast.success("FAQ created successfully");
      navigate("/faq-management");
    } catch (error) {
      console.error("Failed to create FAQ:", error);
      toast.error("Failed to create FAQ");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/faq-management")}
          className="mr-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create New FAQ</h1>
          <p className="text-muted-foreground">
            Add a frequently asked question to your site
          </p>
        </div>
      </div>

      <Card className="max-w-2xl mx-auto">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>FAQ Details</CardTitle>
            <CardDescription>
              Fill out the details for the new FAQ
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="question">
                Question <span className="text-destructive">*</span>
              </Label>
              <Input
                id="question"
                name="question"
                value={formData.question}
                onChange={handleFormChange}
                placeholder="Enter the question"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="answer">
                Answer <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="answer"
                name="answer"
                value={formData.answer}
                onChange={handleFormChange}
                placeholder="Enter the answer"
                rows={6}
                required
              />
              <p className="text-xs text-muted-foreground">
                You can use basic HTML tags for formatting
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                name="category"
                value={formData.category}
                onChange={handleFormChange}
                placeholder="E.g., Shipping, Returns, Product Info (optional)"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isPublished"
                checked={formData.isPublished}
                onCheckedChange={handleSwitchChange}
              />
              <Label htmlFor="isPublished">
                Publish immediately ({formData.isPublished ? "Yes" : "No"})
              </Label>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/faq-management")}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create FAQ"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
