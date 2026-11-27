import React, { useEffect, useState, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Send, MessageCircle, Smile } from "lucide-react";
import API from "../api";
import { useAuth } from "../context/AuthContext.jsx";
import Card from "../components/ui/Card.jsx";
import Avatar from "../components/ui/Avatar.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import Skeleton from "../components/ui/Skeleton.jsx";
import { container, item } from "../components/ui/motion.js";
import { timeAgo } from "../utils/ui.js";

const QUICK_REPLIES = ["Thanks, this helps! 🙏", "Same doubt here 👀", "Can someone share notes?", "Let's form a study group!"];

export default function DiscussionDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const bottomRef = useRef(null);

  const fetchPost = async () => {
    try {
      const { data } = await API.get(`/discussions/${id}`);
      setPost(data);

      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 100);
    } catch (err) {
      console.error("Error fetching discussion:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPost();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const addComment = async (text = commentText) => {
    if (!text.trim()) return;

    setSending(true);
    try {
      await API.post(`/discussions/${id}/comment`, { text });
      setCommentText("");
      await fetchPost(); // reload comments
    } catch (err) {
      console.error("Error posting comment:", err);
    } finally {
      setSending(false);
    }
  };

  if (loading)
    return (
      <div className="mx-auto max-w-4xl space-y-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-96" />
      </div>
    );
  if (!post)
    return (
      <EmptyState
        icon={MessageCircle}
        title="Discussion not found"
        text="It may have been removed."
        action={<Link to="/discussions" className="btn-ghost">Back to forum</Link>}
      />
    );

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="mx-auto max-w-4xl space-y-5">
      <motion.div variants={item}>
        <Link to="/discussions" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-400 transition hover:text-white">
          <ArrowLeft size={16} /> Back to forum
        </Link>
      </motion.div>

      {/* Question */}
      <Card className="p-6" glow="rgba(244,114,182,0.12)">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-fuchsia-600/15 via-transparent to-violet-600/10" />
        <div className="flex items-center gap-3">
          <Avatar name={post.author} size={44} />
          <div>
            <div className="font-semibold text-white">{post.author}</div>
            <div className="text-xs text-slate-400">asked {timeAgo(post.createdAt)}</div>
          </div>
        </div>
        <h1 className="mt-4 text-2xl font-bold leading-snug text-white sm:text-3xl">{post.title}</h1>
        {post.body && <p className="mt-3 text-slate-300">{post.body}</p>}
        <div className="mt-4 flex flex-wrap gap-2">
          {post.tags.filter(Boolean).map((t, i) => (
            <span key={i} className="chip">#{t}</span>
          ))}
        </div>
      </Card>

      {/* Conversation */}
      <Card className="p-0" spotlight={false}>
        <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
          <h2 className="section-title text-base">
            <MessageCircle size={17} className="text-fuchsia-300" /> {post.comments.length} {post.comments.length === 1 ? "reply" : "replies"}
          </h2>
        </div>

        <div className="max-h-[480px] space-y-5 overflow-y-auto px-6 py-5">
          {post.comments.length === 0 ? (
            <div className="py-10 text-center">
              <div className="text-4xl">💬</div>
              <p className="mt-2 text-slate-400">No replies yet. Be the first to help out!</p>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {post.comments.map((c, i) => {
                const mine = c.author === user?.name;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 12, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 26 }}
                    className={`flex items-end gap-3 ${mine ? "flex-row-reverse" : ""}`}
                  >
                    <Avatar name={c.author} size={34} />
                    <div className={`max-w-[80%] ${mine ? "items-end text-right" : ""} flex flex-col`}>
                      <div className="mb-1 text-xs text-slate-400">
                        <span className="font-semibold text-slate-200">{mine ? "You" : c.author}</span> · {timeAgo(c.createdAt)}
                      </div>
                      <div
                        className={`rounded-2xl px-4 py-2.5 text-left text-sm leading-relaxed ${
                          mine
                            ? "rounded-br-md bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-glow"
                            : "rounded-bl-md border border-white/10 bg-white/[0.06] text-slate-200"
                        }`}
                      >
                        {c.text}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Composer */}
        <div className="border-t border-white/[0.06] p-4">
          <div className="mb-3 flex flex-wrap gap-1.5">
            {QUICK_REPLIES.map((q) => (
              <button key={q} onClick={() => addComment(q)} disabled={sending} className="chip transition hover:border-violet-400/30 hover:text-white">
                <Smile size={11} /> {q}
              </button>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              addComment();
            }}
            className="flex gap-2"
          >
            <input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a reply… (Enter to send)"
              className="input flex-1"
            />
            <button type="submit" disabled={!commentText.trim() || sending} className="btn-primary">
              <Send size={16} /> <span className="hidden sm:inline">Send</span>
            </button>
          </form>
        </div>
      </Card>
    </motion.div>
  );
}
