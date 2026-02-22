"use client";

import { useState, useEffect, useCallback } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { Play, Trophy, Loader2, Save } from "lucide-react";
import type { RoutineExercise } from "@/lib/routine";

type Props = {
  exercise: RoutineExercise | null;
  open: boolean;
  onClose: () => void;
};

type PR = {
  weight_kg: number;
  reps: number;
  notes: string | null;
  recorded_at: string;
};

export function ExerciseDetailSheet({ exercise, open, onClose }: Props) {
  const supabase = supabaseBrowser();
  const [pr, setPr] = useState<PR | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("1");

  const fetchPR = useCallback(async () => {
    if (!exercise) return;
    setLoading(true);
    const { data } = await supabase
      .from("personal_records")
      .select("weight_kg,reps,notes,recorded_at")
      .eq("exercise_id", exercise.exercise_id)
      .maybeSingle();

    if (data) {
      setPr(data as PR);
      setWeight(String(data.weight_kg));
      setReps(String(data.reps));
    } else {
      setPr(null);
      setWeight("");
      setReps("1");
    }
    setLoading(false);
    setSaved(false);
  }, [exercise, supabase]);

  useEffect(() => {
    if (open && exercise) {
      fetchPR();
    }
  }, [open, exercise, fetchPR]);

  async function handleSavePR() {
    if (!exercise || !weight) return;
    setSaving(true);
    const { error } = await supabase.rpc("save_personal_record", {
      p_exercise_id: exercise.exercise_id,
      p_weight_kg: parseFloat(weight),
      p_reps: parseInt(reps, 10) || 1,
    });
    if (!error) {
      setSaved(true);
      setPr({
        weight_kg: parseFloat(weight),
        reps: parseInt(reps, 10) || 1,
        notes: null,
        recorded_at: new Date().toISOString(),
      });
    }
    setSaving(false);
  }

  if (!exercise) return null;

  return (
    <Sheet open={open} onClose={onClose} title={exercise.exercise_name}>
      <div className="space-y-4">
        {/* Exercise info */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-white/5 px-2.5 py-1 text-xs text-muted">
              {exercise.muscle_group}
            </span>
            {exercise.reps && (
              <span className="text-xs text-muted">{exercise.reps} reps</span>
            )}
          </div>
          {exercise.notes && (
            <p className="text-sm text-muted">{exercise.notes}</p>
          )}
        </div>

        {/* YouTube link */}
        {exercise.youtube_url && (
          <a
            href={exercise.youtube_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/5 p-3 transition hover:bg-red-500/10"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10">
              <Play className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-text">Watch Tutorial</p>
              <p className="text-xs text-muted">Opens in YouTube</p>
            </div>
          </a>
        )}

        {/* PR Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-warning" />
            <h3 className="text-sm font-semibold text-text">Personal Record</h3>
          </div>

          {loading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted" />
            </div>
          ) : (
            <>
              {pr && (
                <div className="rounded-xl border border-warning/20 bg-warning/5 p-3">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-warning">
                      {pr.weight_kg}
                    </span>
                    <span className="text-sm text-warning/70">kg</span>
                    <span className="ml-2 text-sm text-muted">
                      x {pr.reps} {pr.reps === 1 ? "rep" : "reps"}
                    </span>
                  </div>
                  <p className="mt-1 text-[10px] text-muted">
                    Set on{" "}
                    {new Date(pr.recorded_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <p className="text-xs text-muted">
                  {pr ? "Update your PR:" : "Set your PR:"}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-1 block text-[10px] text-muted">
                      Weight (kg)
                    </label>
                    <Input
                      type="number"
                      step="0.5"
                      min="0"
                      value={weight}
                      onChange={(e) => {
                        setWeight(e.target.value);
                        setSaved(false);
                      }}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] text-muted">
                      Reps
                    </label>
                    <Input
                      type="number"
                      min="1"
                      value={reps}
                      onChange={(e) => {
                        setReps(e.target.value);
                        setSaved(false);
                      }}
                      placeholder="1"
                    />
                  </div>
                </div>
                <Button
                  onClick={handleSavePR}
                  disabled={!weight || saving || saved}
                  variant={saved ? "secondary" : "primary"}
                  className="w-full"
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : saved ? (
                    "PR Saved!"
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      {pr ? "Update PR" : "Save PR"}
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </Sheet>
  );
}
