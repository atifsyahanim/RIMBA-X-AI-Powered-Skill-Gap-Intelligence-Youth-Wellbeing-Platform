"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/lib/hooks/useUser";
import {
  Send,
  Sparkles,
  Compass,
  MapPin,
  Loader2,
  BookmarkPlus,
  Check,
  ChevronLeft,
  Clock,
  Target,
  ListTodo,
  BookOpen,
} from "lucide-react";
import toast from "react-hot-toast";

interface Message {
  id: string;
  role: "user" | "ai";
  content: string;
}

interface Course {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  estimated_time: string;
  subtopics: string[];
  study_planner: string[];
  learning_outcomes: string[];
}

interface ModuleTopic {
  topic_group: string;
  courses: Course[];
}

interface RoadmapData {
  track: string;
  level: string;
  focus_areas: string[];
  modules: ModuleTopic[];
}

function DarkChatBubble({
  msg,
  userInitial,
  isLatest,
  onOptionClick,
}: {
  msg: Message;
  userInitial: string;
  isLatest?: boolean;
  onOptionClick?: (text: string) => void;
}) {
  const isUser = msg.role === "user";

  // We visually hide the json block in the chat since it's going to trigger a view change anyway.
  let displayContent = msg.content;
  const fullJsonMatch = displayContent.match(/```json\n([\s\S]*?)\n```/);
  if (fullJsonMatch) {
    displayContent = displayContent.replace(
      fullJsonMatch[0],
      "\n\n*Generating your visual roadmap...*",
    );
  } else {
    const partialJsonMatch = displayContent.match(/```json[\s\S]*/);
    if (partialJsonMatch) {
      displayContent = displayContent.replace(
        partialJsonMatch[0],
        "\n\n*Generating your visual roadmap...*",
      );
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`flex gap-3 w-full ${isUser ? "flex-row-reverse" : ""}`}
    >
      <div
        className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-semibold"
        style={{
          background: "#334155",
          color: "#f8fafc",
        }}
      >
        {isUser ? userInitial : <Sparkles size={14} />}
      </div>
      <div
        className="max-w-[80%] overflow-x-auto rounded-2xl px-5 py-4 text-sm leading-relaxed"
        style={
          isUser
            ? {
                background: "#1e293b",
                color: "#f8fafc",
                borderRadius: "18px 4px 18px 18px",
                border: "1px solid #334155",
              }
            : {
                background: "#0f172a",
                color: "#e2e8f0",
                borderRadius: "4px 18px 18px 18px",
                border: "1px solid #1e293b",
              }
        }
      >
        {displayContent === "" ? (
          <div className="flex items-center gap-1 py-1">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-2 h-2 rounded-full bg-slate-500 animate-bounce"
                style={{ animationDelay: `${i * 150}ms` }}
              />
            ))}
          </div>
        ) : (
          <div
            className="prose prose-invert prose-sm max-w-none
            [&>p]:mb-2 [&>p:last-child]:mb-0
            [&>ol]:mt-2 [&>ol]:mb-2 [&>ol]:pl-5 [&>ol>li]:mb-1
            [&>ul]:mt-2 [&>ul]:mb-2 [&>ul]:pl-5 [&>ul>li]:mb-1
            [&>h2]:text-base [&>h2]:font-semibold [&>h2]:text-slate-200 [&>h2]:mt-4 [&>h2]:mb-2
            [&>h3]:text-sm [&>h3]:font-semibold [&>h3]:text-slate-300 [&>h3]:mt-3 [&>h3]:mb-1
            [&_strong]:text-white [&_strong]:font-medium
            [&_em]:text-slate-300 [&_em]:not-italic [&_em]:font-normal"
          >
            <ReactMarkdown
              components={{
                li: ({ node, ...props }) => {
                  if (!isUser && isLatest && onOptionClick) {
                    return (
                      <li
                        className="cursor-pointer bg-slate-800 hover:bg-slate-700 px-4 py-3 rounded-xl transition-all border border-slate-700 hover:border-slate-500 list-none my-2.5 active:scale-95 text-slate-200 flex items-start gap-3"
                        onClick={(e) =>
                          onOptionClick(e.currentTarget.textContent || "")
                        }
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-2 shrink-0" />
                        <span {...props} />
                      </li>
                    );
                  }
                  return <li {...props} />;
                },
              }}
            >
              {displayContent}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function ModuleDetailView({
  course,
  onBack,
  userId,
}: {
  course: Course;
  onBack: () => void;
  userId?: string;
}) {
  const supabase = createClient();

  const handleStart = async () => {
    if (userId) {
      // Convert estimated_time string to hours (e.g., "2 hours" -> 2)
      let estimatedHours = 1;
      if (course.estimated_time) {
        const match = course.estimated_time.match(/\d+/);
        if (match) estimatedHours = parseInt(match[0]);
      }

      try {
        // Use type assertion to bypass TypeScript check
        const { error } = await (
          supabase.from("learning_modules") as any
        ).insert({
          user_id: userId,
          title: course.title,
          skill_target: course.title,
          description: course.description,
          difficulty: course.difficulty.toLowerCase(),
          estimated_hours: estimatedHours,
          status: "pending",
          completion_pct: 0,
          resources: [],
          certificate_url: null,
          completed_at: null,
          gap_analysis_id: null,
        });

        if (error) {
          console.error("Error saving module:", error);
          toast.error("Could not save to dashboard.", {
            style: {
              background: "#1e293b",
              color: "#f8fafc",
              border: "1px solid #ef4444",
            },
          });
        } else {
          toast.success(`Started Module: ${course.title}`, {
            icon: "🚀",
            style: {
              background: "#1e293b",
              color: "#f8fafc",
              border: "1px solid #334155",
            },
          });
        }
      } catch (err) {
        console.error("Unexpected error:", err);
        toast.error("Failed to start module. Please try again.");
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="w-full h-full bg-slate-950 p-6 md:p-10 overflow-y-auto styled-scrollbar text-slate-200"
    >
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-slate-400 hover:text-white mb-8 transition-colors text-sm font-medium"
      >
        <ChevronLeft size={16} /> Back to Learning Path
      </button>

      <div className="max-w-4xl mx-auto space-y-8 pb-10">
        <div className="border-b border-slate-800 pb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 text-xs font-bold rounded-full border border-indigo-500/20 uppercase tracking-wide">
              {course.difficulty}
            </span>
            <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
              <Clock size={14} /> {course.estimated_time}
            </span>
          </div>
          <h1 className="text-3xl font-bold !text-white mb-3">
            {course.title}
          </h1>
          <p className="text-slate-400 leading-relaxed text-lg">
            {course.description}
          </p>

          <button
            onClick={handleStart}
            className="mt-6 flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 active:scale-95"
          >
            <Target size={18} /> Start This Module
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Col */}
          <div className="space-y-8">
            <div>
              <h3 className="flex items-center gap-2 text-lg font-bold !text-white mb-4">
                <BookOpen size={20} className="text-blue-400" /> Subtopics
                Breakdown
              </h3>
              <ul className="space-y-3">
                {course.subtopics?.map((st, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 bg-slate-900 p-4 rounded-xl border border-slate-800"
                  >
                    <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400 shrink-0 mt-0.5">
                      {i + 1}
                    </div>
                    <span className="text-sm font-medium">{st}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="flex items-center gap-2 text-lg font-bold !text-white mb-4">
                <Sparkles size={20} className="text-amber-400" /> Learning
                Outcomes
              </h3>
              <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 space-y-3">
                {course.learning_outcomes?.map((lo, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Check
                      size={16}
                      className="text-emerald-500 shrink-0 mt-0.5"
                    />
                    <span className="text-sm text-slate-300">{lo}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Col */}
          <div>
            <h3 className="flex items-center gap-2 text-lg font-bold !text-white mb-4">
              <ListTodo size={20} className="text-purple-400" /> Suggested Study
              Planner
            </h3>
            <div className="relative border-l-2 border-slate-800 ml-3 space-y-6">
              {course.study_planner?.map((plan, i) => {
                const [week, ...descObj] = plan.split(":");
                const desc = descObj.join(":");
                return (
                  <div key={i} className="relative pl-6">
                    <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-slate-900 border-2 border-purple-500" />
                    <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                      <h4 className="text-xs font-bold !text-purple-400 uppercase tracking-wider mb-1">
                        {week || `Step ${i + 1}`}
                      </h4>
                      <p className="text-sm text-slate-300 leading-relaxed">
                        {desc?.trim() || plan}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ModuleSelectionView({
  roadmapData,
  onSelectCourse,
  onRegenerate,
}: {
  roadmapData: RoadmapData;
  onSelectCourse: (c: Course) => void;
  onRegenerate: () => void;
}) {
  const handleSave = () => {
    localStorage.setItem("rimbax_roadmap", JSON.stringify(roadmapData));
    toast.success("Your Learning Path has been saved.", {
      icon: "✅",
      style: {
        background: "#1e293b",
        color: "#f8fafc",
        border: "1px solid #334155",
      },
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full h-full bg-slate-950 p-6 md:p-10 overflow-y-auto styled-scrollbar text-slate-200"
    >
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 border-b border-slate-800 pb-8">
          <div>
            <h1 className="text-3xl font-bold !text-white mb-2">
              Your Recommended Path
            </h1>
            <div className="flex items-center gap-3 text-sm font-medium">
              <span className="text-indigo-400">{roadmapData.track}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
              <span className="text-emerald-400">{roadmapData.level}</span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {roadmapData.focus_areas?.map((area, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 bg-slate-800 text-slate-300 text-xs font-semibold rounded-lg border border-slate-700"
                >
                  {area}
                </span>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-3 min-w-[200px]">
            <button
              onClick={handleSave}
              className="w-full px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 transition-all text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-500/20 flex justify-center items-center gap-2"
            >
              <BookmarkPlus size={16} /> Save Roadmap
            </button>
            <button
              onClick={onRegenerate}
              className="w-full px-4 py-2 bg-slate-800 hover:bg-slate-700 active:scale-95 transition-all text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 text-center"
            >
              Generate New Roadmap
            </button>
          </div>
        </div>

        <div className="space-y-12 pb-10">
          {roadmapData.modules?.map((topic, tIdx) => (
            <div key={tIdx}>
              <h2 className="text-xl font-bold !text-white mb-6 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                  {tIdx + 1}
                </div>
                {topic.topic_group}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pl-0 md:pl-11">
                {topic.courses?.map((course, cIdx) => (
                  <div
                    key={cIdx}
                    onClick={() => onSelectCourse(course)}
                    className="bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-5 cursor-pointer group transition-all hover:shadow-xl hover:shadow-indigo-500/10 flex flex-col h-full active:scale-[0.98]"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2.5 py-1 bg-slate-800 text-slate-400 text-[10px] font-bold uppercase tracking-wider rounded-md border border-slate-700">
                        {course.difficulty}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] font-medium text-slate-500">
                        <Clock size={12} /> {course.estimated_time}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold !text-slate-200 group-hover:!text-indigo-400 transition-colors mb-2">
                      {course.title}
                    </h3>
                    <p className="text-sm text-slate-500 line-clamp-3 mb-6 flex-1">
                      {course.description}
                    </p>

                    <div className="mt-auto pt-4 border-t border-slate-800/50 flex items-center justify-between text-indigo-400 text-xs font-semibold">
                      <span>View Details</span>
                      <span className="group-hover:translate-x-1 transition-transform">
                        →
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export default function LearningPathPage() {
  const { user, loading } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  // Phase States
  const [roadmapData, setRoadmapData] = useState<RoadmapData | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const userInitial = (user?.user_metadata?.full_name || user?.email || "U")
    .charAt(0)
    .toUpperCase();

  // Scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Detect JSON when streaming stops
  useEffect(() => {
    if (!isStreaming && messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.role === "ai") {
        const match = lastMsg.content.match(/```json\n([\s\S]*?)\n```/);
        if (match && match[1]) {
          try {
            const parsed = JSON.parse(match[1]);
            if (parsed && parsed.roadmap) {
              // Small delay to allow user to read the success message briefly
              setTimeout(() => {
                setRoadmapData(parsed.roadmap);
              }, 1500);
            }
          } catch (e) {
            console.error("Failed to parse roadmap data", e);
          }
        }
      }
    }
  }, [isStreaming, messages]);

  const startAdaptiveEngine = async () => {
    setIsStreaming(true);
    setIsInitializing(true);
    setMessages([]);
    setRoadmapData(null);
    setSelectedCourse(null);

    try {
      const tempId = Date.now().toString();
      setMessages([{ id: tempId, role: "ai", content: "" }]);

      const res = await fetch("/api/learning-path", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "Hello! Please begin our learning path context collection.",
          history: [],
        }),
      });

      if (!res.body) return;
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let completeMessage = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        completeMessage += chunk;
        setMessages([{ id: tempId, role: "ai", content: completeMessage }]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsStreaming(false);
      setIsInitializing(false);
    }
  };

  // Initial trigger to start context collection
  useEffect(() => {
    // We now wait for the user to click the "Start Adaptive Learning Engine" button
  }, [loading]);

  const handleSend = async (overrideInput?: string) => {
    const textToSend = overrideInput ?? input;
    if (!textToSend.trim() || isStreaming || roadmapData) return; // Prevent sending if roadmap is done

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: textToSend.trim(),
    };
    const currentHistory = [...messages];

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsStreaming(true);

    const aiMsgId = (Date.now() + 1).toString();
    setMessages((prev) => [...prev, { id: aiMsgId, role: "ai", content: "" }]);

    try {
      const res = await fetch("/api/learning-path", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg.content,
          history: currentHistory.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!res.body) return;
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let completeResponse = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        completeResponse += chunk;
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiMsgId ? { ...msg, content: completeResponse } : msg,
          ),
        );
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMsgId
            ? {
                ...msg,
                content: "Sorry, I encountered an error. Please try again.",
              }
            : msg,
        ),
      );
    } finally {
      setIsStreaming(false);
    }
  };

  if (loading)
    return (
      <div className="h-[calc(100vh-80px)] w-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );

  return (
    <div className="h-[calc(100vh-80px)] w-full flex flex-col items-center bg-slate-950 rounded-3xl overflow-hidden border border-slate-800 relative shadow-sm">
      {/* Phase 3: Module Detail View */}
      <AnimatePresence>
        {selectedCourse && (
          <div className="absolute inset-0 z-50 bg-slate-950">
            <ModuleDetailView
              course={selectedCourse}
              onBack={() => setSelectedCourse(null)}
              userId={user?.id}
            />
          </div>
        )}
      </AnimatePresence>

      {/* Phase 2: Roadmap View */}
      <AnimatePresence>
        {roadmapData && !selectedCourse && (
          <div className="absolute inset-0 z-40 bg-slate-950">
            <ModuleSelectionView
              roadmapData={roadmapData}
              onSelectCourse={(c) => setSelectedCourse(c)}
              onRegenerate={() => startAdaptiveEngine()}
            />
          </div>
        )}
      </AnimatePresence>

      {/* Phase 1: Chat interface below */}
      <div
        className={`flex flex-col w-full h-full ${roadmapData ? "opacity-0 pointer-events-none" : "opacity-100"}`}
      >
        {/* Header */}
        <div className="w-full flex items-center justify-center gap-3 py-5 border-b border-slate-800 bg-slate-900 shrink-0 z-10">
          <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center">
            <Compass className="text-slate-300 w-5 h-5" />
          </div>
          <div className="text-center md:text-left">
            <h1 className="text-xl font-semibold !text-slate-100 tracking-wide">
              Adaptive Diagnosis
            </h1>
            <p className="text-xs font-medium tracking-wider text-slate-400 uppercase">
              My Learning Path Engine
            </p>
          </div>
        </div>

        {/* Messages Area */}
        <div className="w-full flex-1 overflow-y-auto px-4 md:px-8 py-8 scroll-smooth styled-scrollbar">
          {messages.length === 0 ? (
            <div className="h-full w-full flex flex-col items-center justify-center space-y-4">
              <Compass size={56} className="text-slate-600 mb-2" />
              <h2 className="text-xl md:text-2xl font-bold !text-slate-200">
                Ready to build your roadmap?
              </h2>
              <p className="text-slate-400 text-sm max-w-sm text-center">
                Click below to start an interactive diagnosis and generate your
                personalized learning path.
              </p>
              <button
                onClick={startAdaptiveEngine}
                className="mt-6 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg active:scale-95 flex items-center gap-2 border border-indigo-500/50 hover:shadow-indigo-500/20"
              >
                <Sparkles size={18} /> Start Adaptive Learning Engine
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((msg, idx) => (
                <DarkChatBubble
                  key={msg.id}
                  msg={msg}
                  userInitial={userInitial}
                  isLatest={idx === messages.length - 1}
                  onOptionClick={(opt) => handleSend(opt)}
                />
              ))}
            </div>
          )}
          <div ref={bottomRef} className="h-4" />
        </div>

        {/* Input Area */}
        <div className="w-full shrink-0 p-4 md:p-6 bg-slate-900 border-t border-slate-800">
          <div className="max-w-4xl mx-auto relative flex gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                className="w-full rounded-2xl border-2 border-slate-800 bg-slate-950 py-4 pl-5 pr-12 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-slate-600 focus:ring-2 focus:ring-slate-800 transition-all shadow-inner"
                placeholder={
                  isInitializing
                    ? "Initializing Engine..."
                    : "Type your answer..."
                }
                value={input}
                disabled={isInitializing || isStreaming}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
            </div>
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isStreaming || isInitializing}
              className="w-14 h-[54px] rounded-2xl flex items-center justify-center transition-all bg-slate-800 border border-slate-700 text-slate-200 disabled:opacity-50 hover:bg-slate-700 hover:text-white active:scale-95 shrink-0"
            >
              <Send size={20} />
            </button>
          </div>
          <div className="max-w-4xl mx-auto flex items-center justify-center mt-3 text-[11px] text-slate-500">
            <MapPin size={12} className="mr-1" /> Answer the diagnostic
            questions to map your learning path.
          </div>
        </div>
      </div>

      {/* Tailwind classes that might be used by ReactMarkdown but not mapped */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .styled-scrollbar::-webkit-scrollbar { width: 6px; }
            .styled-scrollbar::-webkit-scrollbar-track { background: transparent; }
            .styled-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
            .styled-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }
      `,
        }}
      />
    </div>
  );
}
