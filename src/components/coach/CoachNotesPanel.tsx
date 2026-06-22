// src/components/coach/CoachNotesPanel.tsx
import { useState, useMemo } from "react";
import { useStore, actions } from "@/data/store";
import type { CoachNote, CoachNoteCategory, CoachNoteVisibility } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  Pin, 
  Trash2, 
  Edit3, 
  FileText, 
  Plus, 
  X, 
  Calendar, 
  Eye, 
  EyeOff, 
  AlertTriangle,
  FolderOpen,
  CheckCircle2
} from "lucide-react";

interface CoachNotesPanelProps {
  clientId: string;
}

export default function CoachNotesPanel({ clientId }: CoachNotesPanelProps) {
  const { coachNotes } = useStore();
  
  // Local state
  const [editNoteId, setEditNoteId] = useState<string | null>(null);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  
  // Composer Form state
  const [formTitle, setFormTitle] = useState("");
  const [formCategory, setFormCategory] = useState<CoachNoteCategory>("General");
  const [formVisibility, setFormVisibility] = useState<CoachNoteVisibility>("private");
  const [formBody, setFormBody] = useState("");
  const [formFollowUpDate, setFormFollowUpDate] = useState("");
  const [formPinned, setFormPinned] = useState(false);

  // Filters state
  const [activeFilter, setActiveFilter] = useState<"all" | "private" | "client_safe" | "pinned" | "follow_up">("all");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<CoachNoteCategory | "All">("All");

  // Get notes for current client
  const clientNotes = useMemo(() => {
    return coachNotes.filter((n) => n.clientId === clientId);
  }, [coachNotes, clientId]);

  // Apply filters and sort (pinned first, then by date descending)
  const filteredNotes = useMemo(() => {
    let list = [...clientNotes];

    // Filter by main selector
    if (activeFilter === "private") {
      list = list.filter((n) => n.visibility === "private");
    } else if (activeFilter === "client_safe") {
      list = list.filter((n) => n.visibility === "client_safe");
    } else if (activeFilter === "pinned") {
      list = list.filter((n) => n.pinned);
    } else if (activeFilter === "follow_up") {
      list = list.filter((n) => n.followUpDate);
    }

    // Filter by Category
    if (selectedCategoryFilter !== "All") {
      list = list.filter((n) => n.category === selectedCategoryFilter);
    }

    // Sort: Pinned first, then newest first
    return list.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [clientNotes, activeFilter, selectedCategoryFilter]);

  // Client safe notes list
  const clientSafeNotes = useMemo(() => {
    return clientNotes.filter((n) => n.visibility === "client_safe");
  }, [clientNotes]);

  // Composer Actions
  const handleOpenComposer = () => {
    setEditNoteId(null);
    setFormTitle("");
    setFormCategory("General");
    setFormVisibility("private");
    setFormBody("");
    setFormFollowUpDate("");
    setFormPinned(false);
    setIsComposerOpen(true);
  };

  const handleEditNote = (note: CoachNote) => {
    setEditNoteId(note.id);
    setFormTitle(note.title);
    setFormCategory(note.category);
    setFormVisibility(note.visibility);
    setFormBody(note.body);
    setFormFollowUpDate(note.followUpDate || "");
    setFormPinned(note.pinned);
    setIsComposerOpen(true);
  };

  const handleCancelComposer = () => {
    setEditNoteId(null);
    setFormTitle("");
    setFormCategory("General");
    setFormVisibility("private");
    setFormBody("");
    setFormFollowUpDate("");
    setFormPinned(false);
    setIsComposerOpen(false);
  };

  const handleSaveNote = () => {
    if (!formTitle.trim() || !formBody.trim()) return;

    if (editNoteId) {
      // Find original note to retain createdAt
      const original = clientNotes.find((n) => n.id === editNoteId);
      if (original) {
        const updated: CoachNote = {
          ...original,
          title: formTitle,
          category: formCategory,
          visibility: formVisibility,
          body: formBody,
          followUpDate: formFollowUpDate || undefined,
          pinned: formPinned,
          updatedAt: new Date().toISOString()
        };
        actions.updateCoachNote(updated);
      }
    } else {
      const noteData = {
        clientId,
        title: formTitle,
        category: formCategory,
        visibility: formVisibility,
        body: formBody,
        followUpDate: formFollowUpDate || undefined,
        pinned: formPinned
      };
      actions.addCoachNote(noteData);
    }
    handleCancelComposer();
  };

  const handleDeleteNote = (noteId: string) => {
    if (confirm("Are you sure you want to delete this note?")) {
      actions.deleteCoachNote(noteId);
    }
  };

  const handleTogglePin = (noteId: string) => {
    actions.toggleCoachNotePinned(noteId);
  };

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const categories: CoachNoteCategory[] = [
    "Lab Review",
    "Training",
    "Nutrition",
    "Supplements",
    "Check-In",
    "General",
    "Follow-Up"
  ];

  return (
    <div className="space-y-5 animate-fade-in pb-8">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/20 pb-4">
        <div>
          <h2 className="font-display text-xl font-bold tracking-tight text-glow text-primary flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" /> Coach Notes
          </h2>
          <p className="text-[9px] text-muted-foreground uppercase font-mono tracking-widest mt-0.5">
            Prototype notes system · Live database planned
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Private coach memory and client-safe guidance
          </p>
        </div>

        {!isComposerOpen && (
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={handleOpenComposer} 
            className="h-7.5 px-3.5 text-xs font-semibold uppercase tracking-wider font-mono border border-border/40 hover:border-primary/20 self-end sm:self-center"
          >
            <Plus className="mr-1 h-3.5 w-3.5 text-primary" /> Add Note
          </Button>
        )}
      </div>

      {/* Main Composer Box */}
      {isComposerOpen && (
        <div className="lab-card-glow p-4 border border-border/60 bg-[#0e1217]/50 rounded-xl space-y-4">
          <div className="flex items-center justify-between border-b border-border/10 pb-2">
            <h3 className="font-display font-semibold text-xs text-primary uppercase tracking-wider">
              {editNoteId ? "Edit Note" : "Create Note"}
            </h3>
            <Button variant="ghost" size="icon" onClick={handleCancelComposer} className="h-6 w-6">
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[8px] font-mono uppercase text-muted-foreground block tracking-wider">Note Title</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="input-glass mt-0.5 py-1 px-2.5 w-full text-xs"
                  placeholder="e.g. Sleep & Rest Metric Feedback"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[8px] font-mono uppercase text-muted-foreground block tracking-wider">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as CoachNoteCategory)}
                    className="input-glass mt-0.5 py-1 px-2 bg-[#0e1217] w-full text-xs"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[8px] font-mono uppercase text-muted-foreground block tracking-wider">Visibility</label>
                  <select
                    value={formVisibility}
                    onChange={(e) => setFormVisibility(e.target.value as CoachNoteVisibility)}
                    className="input-glass mt-0.5 py-1 px-2 bg-[#0e1217] w-full text-xs"
                  >
                    <option value="private">Private Coach Note</option>
                    <option value="client_safe">Client-Safe Note</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="text-[8px] font-mono uppercase text-muted-foreground block tracking-wider">Note Contents</label>
              <textarea
                value={formBody}
                onChange={(e) => setFormBody(e.target.value)}
                className="input-glass mt-0.5 py-1.5 px-2.5 w-full text-xs min-h-[100px] font-sans"
                placeholder="Log internal details, progress reviews, or client guidance feedback..."
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between border-t border-border/10 pt-3">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    id="formPinned"
                    checked={formPinned}
                    onChange={(e) => setFormPinned(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-border bg-background accent-primary"
                  />
                  <label htmlFor="formPinned" className="text-[9px] font-mono uppercase text-muted-foreground tracking-wider cursor-pointer">
                    Pin to top
                  </label>
                </div>

                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  <label className="text-[8px] font-mono uppercase text-muted-foreground tracking-wider">Follow-Up Date</label>
                  <input
                    type="date"
                    value={formFollowUpDate}
                    onChange={(e) => setFormFollowUpDate(e.target.value)}
                    className="input-glass py-0.5 px-1 text-[10px] font-mono"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={handleCancelComposer} className="h-7 text-xs font-mono uppercase">
                  Cancel
                </Button>
                <Button variant="neon" size="sm" onClick={handleSaveNote} className="h-7 text-xs font-mono uppercase">
                  Save Note
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grid: Left - Filters & Feed | Right - Client-Safe Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Left Columns: Filters and List */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center bg-[#0e1217]/30 p-2.5 rounded-lg border border-border/40">
            <div className="flex flex-wrap gap-1">
              {[
                { key: "all" as const, label: "All Notes" },
                { key: "private" as const, label: "Private" },
                { key: "client_safe" as const, label: "Client-Safe" },
                { key: "pinned" as const, label: "Pinned" },
                { key: "follow_up" as const, label: "Follow-Up" }
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => setActiveFilter(f.key)}
                  className={cn(
                    "text-[9px] font-mono px-2.5 py-0.5 rounded border transition duration-200",
                    activeFilter === f.key
                      ? "bg-primary/10 border-primary/40 text-primary"
                      : "bg-transparent border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/20"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5 self-end sm:self-center">
              <span className="text-[8px] font-mono uppercase text-muted-foreground">Category:</span>
              <select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value as CoachNoteCategory | "All")}
                className="input-glass py-0.5 px-1.5 text-[10px] font-mono bg-[#0e1217]"
              >
                <option value="All">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes Feed Timeline */}
          <div className="space-y-3">
            {filteredNotes.length === 0 ? (
              <div className="p-10 text-center text-xs text-muted-foreground border border-dashed border-border/40 rounded-xl bg-background/10">
                No client notes found matching current filters.
              </div>
            ) : (
              filteredNotes.map((note) => (
                <div
                  key={note.id}
                  className={cn(
                    "lab-card-glow p-4 border rounded-xl space-y-3 relative group transition duration-300",
                    note.pinned 
                      ? "border-primary/40 bg-[#0e1217]/50" 
                      : "border-border/60 bg-[#0e1217]/30",
                    note.visibility === "private" ? "hover:border-amber-500/25" : "hover:border-primary/20"
                  )}
                >
                  {/* Pinned Marker / Note Header */}
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-bold text-sm text-glow text-primary">
                          {note.title}
                        </h4>
                        
                        {note.pinned && (
                          <span className="text-[7.5px] font-mono uppercase px-1.5 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded flex items-center gap-0.5">
                            <Pin className="h-2 w-2" /> Pinned
                          </span>
                        )}

                        <span className="text-[7.5px] font-mono uppercase px-1.5 py-0.5 bg-secondary/50 text-muted-foreground border border-border/20 rounded">
                          {note.category}
                        </span>

                        <span 
                          className={cn(
                            "text-[7.5px] font-mono uppercase px-1.5 py-0.5 rounded border flex items-center gap-0.5",
                            note.visibility === "private" 
                              ? "bg-amber-500/10 border-amber-500/20 text-amber-300"
                              : "bg-primary/10 border-primary/20 text-primary"
                          )}
                        >
                          {note.visibility === "private" ? (
                            <>
                              <EyeOff className="h-2 w-2" /> Private Note
                            </>
                          ) : (
                            <>
                              <Eye className="h-2 w-2" /> Client-Safe Note
                            </>
                          )}
                        </span>
                      </div>
                      
                      <div className="text-[9px] font-mono text-muted-foreground">
                        {formatDate(note.createdAt)}
                        {note.updatedAt !== note.createdAt && (
                          <span className="italic ml-2">(Edited: {formatDate(note.updatedAt)})</span>
                        )}
                      </div>
                    </div>

                    {/* Actions menu */}
                    <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleTogglePin(note.id)}
                        className={cn(
                          "h-6 w-6 rounded text-muted-foreground hover:text-foreground",
                          note.pinned ? "text-primary hover:text-primary" : ""
                        )}
                        title={note.pinned ? "Unpin Note" : "Pin Note"}
                      >
                        <Pin className="h-3 w-3" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditNote(note)}
                        className="h-6 w-6 rounded text-muted-foreground hover:text-foreground"
                        title="Edit Note"
                      >
                        <Edit3 className="h-3 w-3" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteNote(note.id)}
                        className="h-6 w-6 rounded text-red-400 hover:bg-red-500/10 hover:text-red-400"
                        title="Delete Note"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Body Text */}
                  <p className="text-[11px] text-muted-foreground font-sans whitespace-pre-wrap leading-relaxed">
                    {note.body}
                  </p>

                  {/* Conversation thread */}
                  {note.visibility === "client_safe" && (
                    <NoteConversation note={note} />
                  )}

                  {/* Follow Up Date */}
                  {note.followUpDate && (
                    <div className="flex items-center gap-1.5 text-[8.5px] font-mono text-amber-300 bg-amber-500/5 border border-amber-500/10 px-2 py-0.5 rounded w-fit">
                      <AlertTriangle className="h-3 w-3 shrink-0" />
                      Follow-up scheduled: {formatDate(note.followUpDate).split(",")[0]}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Client-Safe Notes Summary */}
        <div className="space-y-4">
          <div className="lab-card-glow p-4 border border-border/60 bg-[#0e1217]/50 rounded-xl space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-primary font-display uppercase tracking-wider">
              <CheckCircle2 className="h-4 w-4" /> Client-Safe Highlights
            </div>
            
            <p className="text-[10px] text-muted-foreground leading-normal">
              Client-safe notes are suitable for client-facing summaries, but coach approval is still required.
            </p>

            <div className="space-y-2 pt-2 border-t border-border/10">
              {clientSafeNotes.length === 0 ? (
                <p className="text-[10px] italic text-muted-foreground">
                  No notes flagged as client-safe are active.
                </p>
              ) : (
                clientSafeNotes.map((note) => (
                  <div key={note.id} className="p-2 border border-border/30 bg-background/20 rounded-lg space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold text-foreground truncate max-w-[150px]">{note.title}</span>
                      <span className="text-[7px] font-mono text-muted-foreground uppercase">{note.category}</span>
                    </div>
                    <p className="text-[9px] text-muted-foreground line-clamp-3">{note.body}</p>
                    {note.acknowledgedByClient && (
                      <span className="text-[7.5px] text-emerald-450 font-bold flex items-center gap-0.5 mt-1 border-t border-border/10 pt-1">
                        <CheckCircle2 className="h-2 w-2" /> Acknowledged
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

function NoteConversation({ note }: { note: CoachNote }) {
  const [reply, setReply] = useState("");

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim()) return;
    actions.coachReplyToNote(note.id, reply.trim());
    setReply("");
  };

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div className="mt-4 pt-3 border-t border-border/10 space-y-3">
      <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
        <span>Athlete Conversation Thread</span>
        {note.acknowledgedByClient ? (
          <span className="text-emerald-450 flex items-center gap-1 font-bold">
            <CheckCircle2 className="h-3 w-3" /> Acknowledged at {formatDate(note.acknowledgedAt!)}
          </span>
        ) : (
          <span className="text-amber-500 font-semibold">
            Pending Athlete Acknowledgment
          </span>
        )}
      </div>

      {/* Messages Thread */}
      <div className="space-y-2 max-h-48 overflow-y-auto pr-1 flex flex-col">
        {(!note.messages || note.messages.length === 0) ? (
          <p className="text-[10px] italic text-muted-foreground py-1">No conversation messages yet.</p>
        ) : (
          note.messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "p-2 rounded-lg text-[10.5px] max-w-[85%] space-y-0.5",
                msg.senderRole === "coach"
                  ? "bg-zinc-800/40 border border-border/20 self-end text-right"
                  : "bg-background/40 border border-border/10 self-start text-left"
              )}
            >
              <span className="block text-[8px] font-bold uppercase text-muted-foreground">
                {msg.senderRole === "coach" ? "You (Coach)" : "Athlete"}
              </span>
              <p className="text-zinc-200">{msg.text}</p>
              <span className="block text-[7px] text-zinc-500">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Reply Form */}
      <form onSubmit={handleSend} className="flex gap-2 pt-2 border-t border-border/10">
        <input
          type="text"
          placeholder="Respond to athlete..."
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          className="flex-1 input-glass py-1.5 px-2.5 text-xs bg-background/50 border border-border/40 focus:border-primary/40 focus:outline-none"
        />
        <Button type="submit" size="sm" className="h-8 font-mono text-[10px] uppercase tracking-wider bg-zinc-100 hover:bg-white text-zinc-950 px-3">
          Reply
        </Button>
      </form>
    </div>
  );
}
