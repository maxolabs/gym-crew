"use client";

import { useState, useEffect, useCallback } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { Search, Plus } from "lucide-react";
import type { Exercise } from "@/lib/routine";

type Props = {
  open: boolean;
  onClose: () => void;
  onSelect: (exercise: Exercise) => void;
};

const MUSCLE_GROUPS = [
  "All",
  "Warmup",
  "Chest",
  "Back",
  "Shoulders",
  "Legs",
  "Arms",
  "Core",
];

export function ExerciseSearchSheet({ open, onClose, onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("All");
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newGroup, setNewGroup] = useState("Chest");

  const supabase = supabaseBrowser();

  const search = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from("exercises")
      .select("id,name,muscle_group,youtube_url,is_global")
      .order("name");

    if (query.trim()) {
      q = q.ilike("name", `%${query.trim()}%`);
    }
    if (group !== "All") {
      q = q.eq("muscle_group", group);
    }
    q = q.limit(50);

    const { data } = await q;
    setExercises((data as Exercise[]) ?? []);
    setLoading(false);
  }, [query, group, supabase]);

  useEffect(() => {
    if (open) {
      search();
    }
  }, [open, query, group, search]);

  async function handleCreate() {
    if (!newName.trim()) return;
    setCreating(true);
    const { data: user } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("exercises")
      .insert({
        name: newName.trim(),
        muscle_group: newGroup,
        created_by: user.user?.id,
        is_global: false,
      })
      .select("id,name,muscle_group,youtube_url,is_global")
      .single();

    if (data && !error) {
      onSelect(data as Exercise);
      setNewName("");
      onClose();
    }
    setCreating(false);
  }

  return (
    <Sheet open={open} onClose={onClose} title="Search Exercises">
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search exercises..."
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {MUSCLE_GROUPS.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGroup(g)}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                group === g
                  ? "bg-accent text-white"
                  : "bg-card2 text-muted hover:text-text"
              }`}
            >
              {g}
            </button>
          ))}
        </div>

        <div className="max-h-[40vh] space-y-1 overflow-y-auto">
          {loading && (
            <p className="py-4 text-center text-sm text-muted">Loading...</p>
          )}
          {!loading && exercises.length === 0 && (
            <p className="py-4 text-center text-sm text-muted">
              No exercises found
            </p>
          )}
          {exercises.map((ex) => (
            <button
              key={ex.id}
              type="button"
              onClick={() => {
                onSelect(ex);
                onClose();
              }}
              className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-card2 px-3 py-2.5 text-left transition hover:bg-white/5"
            >
              <div>
                <p className="text-sm font-medium text-text">{ex.name}</p>
                <p className="text-xs text-muted">{ex.muscle_group}</p>
              </div>
            </button>
          ))}
        </div>

        <div className="border-t border-white/10 pt-3">
          <p className="mb-2 text-xs font-medium text-muted">
            Can&apos;t find it? Create a new exercise:
          </p>
          <div className="flex gap-2">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Exercise name"
              className="flex-1"
            />
            <select
              value={newGroup}
              onChange={(e) => setNewGroup(e.target.value)}
              className="h-11 rounded-xl border border-white/10 bg-card2 px-2 text-xs text-text"
            >
              {MUSCLE_GROUPS.filter((g) => g !== "All").map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
          <Button
            onClick={handleCreate}
            disabled={!newName.trim() || creating}
            variant="secondary"
            className="mt-2 w-full"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            {creating ? "Creating..." : "Create Exercise"}
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
