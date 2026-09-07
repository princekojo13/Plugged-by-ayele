import React, { useState, useEffect } from "react";
import { Star, MessageSquare } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { cn } from "@/lib/utils";

function StarRating({ value, onChange, size = "w-5 h-5" }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange?.(star)}
          className={cn("transition-transform", onChange && "hover:scale-110 cursor-pointer")}
          disabled={!onChange}
        >
          <Star className={cn(size, star <= value ? "fill-pink text-pink" : "text-muted-foreground/30")} />
        </button>
      ))}
    </div>
  );
}

export default function ReviewSection({ productId }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", rating: 5, title: "", comment: "" });
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const loadReviews = async () => {
    try {
      const data = await base44.entities.Review.filter({ product_id: productId, approved: true }, "-created_date", 50);
      setReviews(data || []);
    } catch (e) {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadReviews();
  }, [productId]);

  const avgRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.comment.trim()) {
      setError("Please enter your name and a comment.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await base44.entities.Review.create({
        product_id: productId,
        rating: form.rating,
        name: form.name.trim(),
        email: form.email.trim(),
        title: form.title.trim(),
        comment: form.comment.trim(),
        approved: true,
      });
      setSuccess(true);
      setForm({ name: "", email: "", rating: 5, title: "", comment: "" });
      await loadReviews();
      setTimeout(() => {
        setShowForm(false);
        setSuccess(false);
      }, 2500);
    } catch (err) {
      setError(err?.message || "Failed to submit review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-16 pt-10 border-t border-border">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-carbon">Customer Reviews</h2>
          {reviews.length > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <StarRating value={Math.round(avgRating)} size="w-4 h-4" />
              <span className="text-sm text-muted-foreground">
                {avgRating.toFixed(1)} out of 5 ({reviews.length} {reviews.length === 1 ? "review" : "reviews"})
              </span>
            </div>
          )}
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="px-4 py-2.5 border border-carbon text-sm font-bold uppercase tracking-wider hover:bg-carbon hover:text-white transition-colors whitespace-nowrap"
        >
          Write a Review
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-london/50 border border-border p-5 sm:p-6 mb-8">
          {success ? (
            <div className="text-center py-6">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Star className="w-6 h-6 text-green-600 fill-green-600" />
              </div>
              <p className="font-semibold text-carbon">Thank you for your review!</p>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <label className="block text-xs uppercase tracking-wider font-semibold text-carbon mb-2">Your Rating</label>
                <StarRating value={form.rating} onChange={(v) => setForm((f) => ({ ...f, rating: v }))} />
              </div>
              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold text-carbon mb-1.5">Name *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="ck-input"
                    placeholder="Your name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold text-carbon mb-1.5">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    className="ck-input"
                    placeholder="Your email (optional)"
                  />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-xs uppercase tracking-wider font-semibold text-carbon mb-1.5">Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="ck-input"
                  placeholder="Summarize your experience"
                />
              </div>
              <div className="mb-4">
                <label className="block text-xs uppercase tracking-wider font-semibold text-carbon mb-1.5">Comment *</label>
                <textarea
                  value={form.comment}
                  onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))}
                  className="ck-input min-h-[100px] resize-y"
                  placeholder="Share your thoughts about this product"
                  required
                />
              </div>
              {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-carbon text-white text-sm font-bold uppercase tracking-wider hover:bg-pink transition-colors disabled:opacity-50"
                >
                  {submitting ? "Submitting..." : "Submit Review"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-2.5 text-sm font-bold uppercase tracking-wider text-muted-foreground hover:text-carbon transition-colors"
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </form>
      )}

      {loading ? (
        <div className="space-y-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-24 bg-london animate-pulse" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-12 bg-london/30">
          <MessageSquare className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground">No reviews yet. Be the first to share your feedback!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {reviews.map((review) => (
            <div key={review.id} className="border-b border-border pb-6">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold text-carbon text-sm">{review.name}</p>
                  <StarRating value={review.rating} size="w-3.5 h-3.5" />
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(review.created_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>
              {review.title && <p className="font-semibold text-carbon text-sm mb-1">{review.title}</p>}
              <p className="text-sm text-muted-foreground leading-relaxed">{review.comment}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}