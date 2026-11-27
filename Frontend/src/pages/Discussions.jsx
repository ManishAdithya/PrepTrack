import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { MessageSquarePlus, Hash, MessagesSquare, Search, Flame, MessageCircle, X, TrendingUp, Send } from "lucide-react";
import API from "../api";
import { useToast } from "../components/ui/Toast.jsx";
import Card from "../components/ui/Card.jsx";
import PageHeader from "../components/ui/PageHeader.jsx";
import Segmented from "../components/ui/Segmented.jsx";
import Modal from "../components/ui/Modal.jsx";
import Avatar from "../components/ui/Avatar.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import Skeleton from "../components/ui/Skeleton.jsx";
import { container } from "../components/ui/motion.js";
import { celebrate } from "../utils/confetti.js";
import { timeAgo } from "../utils/ui.js";

const SUGGESTED_TAGS = ["mid-terms", "pyqs", "doubt", "study-group", "tips", "lab-exam"];

export default function Discussions() {
  const navigate = useNavigate();
  const toast = useToast();
  const [params, setParams] = useSearchParams();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState("");
  const [tags, setTags] = useState([]);
  const [tagDraft, setTagDraft] = useState("");
  const [composerOpen, setComposerOpen] = useState(params.get("new") === "1");
  const [posting, setPosting] = useState(false);

  const [query, setQuery] = useState("");
  const [view, setView] = useState("latest");
  const [activeTag, setActiveTag] = useState(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const { data } = await API.get("/discussions");
        setPosts(data);
      } catch {
        console.error("Error fetching discussions");
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  const closeComposer = () => {
    setComposerOpen(false);
    if (params.get("new")) setParams({}, { replace: true });
  };

  const addTag = (t) => {
    const clean = t.trim().toLowerCase().replace(/\s+/g, "-").replace(/^#/, "");
    if (clean && !tags.includes(clean) && tags.length < 5) setTags([...tags, clean]);
    setTagDraft("");
  };

  const handleCreateDiscussion = async (e) => {
    e?.preventDefault();
    if (!newTitle.trim()) return;

    setPosting(true);
    try {
      const { data } = await API.post("/discussions", {
        title: newTitle,
        tags: tagDraft.trim() ? [...tags, tagDraft.trim()] : tags,
      });
      setPosts([data, ...posts]);
      setNewTitle("");
      setTags([]);
      setTagDraft("");
      closeComposer();
      celebrate({ particleCount: 60 });
      toast({ title: "Discussion posted", description: "Your batchmates can reply now." });
    } catch (err) {
      console.error("Error creating discussion:", err);
      toast({ type: "error", title: "Couldn't post discussion" });
    } finally {
      setPosting(false);
    }
  };

  const tagCounts = useMemo(() => {
    const c = {};
    posts.forEach((p) => (p.tags || []).filter(Boolean).forEach((t) => (c[t] = (c[t] || 0) + 1)));
    return Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 12);
  }, [posts]);

  const trending = useMemo(() => [...posts].sort((a, b) => (b.commentsCount || 0) - (a.commentsCount || 0)).slice(0, 3), [posts]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = posts
      .filter((p) => !activeTag || (p.tags || []).includes(activeTag))
      .filter((p) => !q || p.title.toLowerCase().includes(q) || p.author?.toLowerCase().includes(q));
    if (view === "popular") list = [...list].sort((a, b) => (b.commentsCount || 0) - (a.commentsCount || 0));
    if (view === "unanswered") list = list.filter((p) => !p.commentsCount);
    return list;
  }, [posts, query, view, activeTag]);


  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <PageHeader
        title="Forum"
        subtitle="Ask doubts, share tips, find study partners."
        actions={
          <button onClick={() => setComposerOpen(true)} className="btn-primary w-full sm:w-auto">
            <MessageSquarePlus size={16} /> Ask a question
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr,300px]">
        <div className="min-w-0 space-y-4">

          {/* Filters */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search discussions…" className="input pl-10" />
            </div>
            <Segmented
              size="sm"
              value={view}
              onChange={setView}
              options={[
                { value: "latest", label: "Latest" },
                { value: "popular", label: "Popular", icon: Flame },
                { value: "unanswered", label: "Unanswered" },
              ]}
            />
          </div>

          {activeTag && (
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              Showing
              <button onClick={() => setActiveTag(null)} className="chip !border-accent/30 !bg-accent/15 !text-accent">
                #{activeTag} <X size={12} />
              </button>
            </div>
          )}

          {/* Posts */}
          {loading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => <Skeleton key={i} className="h-32" />)}
            </div>
          ) : visible.length === 0 ? (
            <EmptyState
              icon={MessagesSquare}
              title={posts.length ? "No discussions match" : "No discussions yet"}
              text={posts.length ? "Try another filter or search." : "Start the first conversation for your branch!"}
              action={
                <button onClick={() => setComposerOpen(true)} className="btn-primary">
                  <MessageSquarePlus size={16} /> Start one
                </button>
              }
            />
          ) : (
            <motion.div layout className="space-y-3">
              <AnimatePresence mode="popLayout">
                {visible.map((p) => {
                  const hot = (p.commentsCount || 0) >= 3;
                  const commenters = [...new Set((p.comments || []).filter((c) => !c.removed).map((c) => c.author))].slice(0, 3);
                  return (
                    <motion.div
                      key={p._id}
                      layout
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.97 }}
                      transition={{ type: "spring", stiffness: 300, damping: 28 }}
                    >
                      <Card
                        onClick={() => navigate(`/discussions/${p._id}`)}
                        className="cursor-pointer p-5 transition-colors hover:border-white/15"
                        glow="rgba(244,114,182,0.12)"
                        variants={null}
                      >
                        <div className="flex items-start gap-4">
                          <Avatar name={p.author} size={42} />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                              <span className="font-semibold text-zinc-200">{p.author}</span>
                              <span>· {timeAgo(p.createdAt)}</span>
                              {hot && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 font-bold text-accent">
                                  <Flame size={11} /> Hot
                                </span>
                              )}
                            </div>
                            <div className="mt-1.5 font-display text-lg font-semibold leading-snug text-white">{p.title}</div>
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              {(p.tags || []).filter(Boolean).map((t, idx) => (
                                <button
                                  key={idx}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveTag(t);
                                  }}
                                  className="chip transition hover:border-accent/30 hover:text-accent"
                                >
                                  #{t}
                                </button>
                              ))}
                              <span className="ml-auto flex items-center gap-2 text-sm text-zinc-400">
                                {commenters.length > 0 && (
                                  <span className="flex -space-x-2">
                                    {commenters.map((c) => (
                                      <Avatar key={c} name={c} size={22} className="ring-2 ring-ink-900" />
                                    ))}
                                  </span>
                                )}
                                <MessageCircle size={15} /> {p.commentsCount || 0}
                              </span>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card className="p-5">
            <div className="section-title mb-3 text-base">
              <Hash size={16} className="text-accent" /> Topics
            </div>
            {tagCounts.length === 0 ? (
              <p className="text-sm text-zinc-500">Tags will show up as people post.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {tagCounts.map(([t, c]) => (
                  <button
                    key={t}
                    onClick={() => setActiveTag(activeTag === t ? null : t)}
                    className={`chip transition ${activeTag === t ? "!border-accent/40 !bg-accent/20 !text-white" : "hover:text-white"}`}
                  >
                    #{t} <span className="text-zinc-500">{c}</span>
                  </button>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-5">
            <div className="section-title mb-3 text-base">
              <TrendingUp size={16} className="text-accent" /> Trending
            </div>
            <div className="space-y-1">
              {trending.map((p, i) => (
                <button
                  key={p._id}
                  onClick={() => navigate(`/discussions/${p._id}`)}
                  className="flex w-full items-start gap-3 rounded-xl p-2 text-left transition hover:bg-white/5"
                >
                  <span className="font-display text-xl font-bold text-gradient">{i + 1}</span>
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-2 text-sm font-medium text-zinc-200">{p.title}</span>
                    <span className="text-xs text-zinc-500">{p.commentsCount || 0} replies</span>
                  </span>
                </button>
              ))}
              {trending.length === 0 && <p className="text-sm text-zinc-500">Nothing trending yet.</p>}
            </div>
          </Card>
        </div>
      </div>

      <Modal open={composerOpen} onClose={closeComposer} title="Start a discussion" subtitle="Be specific — good questions get faster answers.">
        <form onSubmit={handleCreateDiscussion} className="space-y-5">
          <div>
            <label className="label">Question or topic</label>
            <textarea
              autoFocus
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g., How do I approach deadlock questions in OS?"
              className="input min-h-24 resize-none"
              maxLength={200}
            />
            <div className="mt-1 text-right text-[11px] text-zinc-500">{newTitle.length}/200</div>
          </div>
          <div>
            <label className="label">Tags</label>
            <div className="input flex min-h-11 flex-wrap items-center gap-2 !py-2">
              {tags.map((t) => (
                <span key={t} className="chip !border-accent/30 !bg-accent/15 !text-accent">
                  #{t}
                  <button type="button" onClick={() => setTags(tags.filter((x) => x !== t))}>
                    <X size={12} />
                  </button>
                </span>
              ))}
              <input
                value={tagDraft}
                onChange={(e) => setTagDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    addTag(tagDraft);
                  } else if (e.key === "Backspace" && !tagDraft && tags.length) {
                    setTags(tags.slice(0, -1));
                  }
                }}
                placeholder={tags.length ? "" : "Type a tag and press Enter"}
                className="min-w-[8rem] flex-1 bg-transparent text-sm outline-none placeholder:text-zinc-500"
              />
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {SUGGESTED_TAGS.filter((t) => !tags.includes(t)).map((t) => (
                <button key={t} type="button" onClick={() => addTag(t)} className="chip transition hover:text-white">
                  + {t}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={closeComposer} className="btn-ghost">
              Cancel
            </button>
            <button type="submit" disabled={!newTitle.trim() || posting} className="btn-primary">
              <MessageSquarePlus size={16} /> {posting ? "Posting…" : "Post"}
            </button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
}
