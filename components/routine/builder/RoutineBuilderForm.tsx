"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardTitle } from "@/components/ui/Card";
import { DayEditor } from "./DayEditor";
import { supabaseBrowser } from "@/lib/supabase/browser";
import {
  createDefaultDay,
  builderToStructure,
  routineToBuilder,
} from "@/lib/routine";
import { Plus, Save, Loader2 } from "lucide-react";
import type { BuilderDay, ActiveRoutine } from "@/lib/routine";

type Props = {
  groupId: string;
  existingRoutine?: ActiveRoutine | null;
};

export function RoutineBuilderForm({ groupId, existingRoutine }: Props) {
  const router = useRouter();
  const supabase = supabaseBrowser();

  const [name, setName] = useState(existingRoutine?.name ?? "");
  const [totalWeeks, setTotalWeeks] = useState(existingRoutine?.total_weeks ?? 4);
  const [startDate, setStartDate] = useState(
    existingRoutine?.start_date ?? new Date().toISOString().slice(0, 10)
  );
  const [days, setDays] = useState<BuilderDay[]>(
    existingRoutine ? routineToBuilder(existingRoutine) : [createDefaultDay(1), createDefaultDay(2), createDefaultDay(3)]
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateDay(index: number, updated: BuilderDay) {
    const next = [...days];
    next[index] = updated;
    setDays(next);
  }

  function removeDay(index: number) {
    setDays(days.filter((_, i) => i !== index));
  }

  function addDay() {
    setDays([...days, createDefaultDay(days.length + 1)]);
  }

  async function handleSave() {
    if (!name.trim()) {
      setError("Routine name is required");
      return;
    }
    if (days.length === 0) {
      setError("Add at least one day");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      let routineId = existingRoutine?.id;

      if (!routineId) {
        // Create new routine
        const { data, error: createErr } = await supabase.rpc("create_routine", {
          p_group_id: groupId,
          p_name: name.trim(),
          p_total_weeks: totalWeeks,
          p_start_date: startDate,
        });
        if (createErr) throw createErr;
        routineId = data as string;
      }

      // Save structure
      const structure = builderToStructure(days);
      const { error: saveErr } = await supabase.rpc("save_routine_structure", {
        p_routine_id: routineId,
        p_structure: structure as any,
      });
      if (saveErr) throw saveErr;

      router.push(`/g/${groupId}`);
      router.refresh();
    } catch (e: any) {
      setError(e.message ?? "Failed to save routine");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card className="space-y-3">
        <CardTitle>Routine Details</CardTitle>
        <div className="space-y-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Routine name (e.g. Month 1 - Hypertrophy)"
          />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-xs text-muted">Total Weeks</label>
              <Input
                type="number"
                min={1}
                max={52}
                value={totalWeeks}
                onChange={(e) => setTotalWeeks(parseInt(e.target.value, 10) || 4)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">Start Date</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
          </div>
        </div>
      </Card>

      {days.map((day, i) => (
        <DayEditor
          key={day._key}
          day={day}
          totalWeeks={totalWeeks}
          onChange={(updated) => updateDay(i, updated)}
          onRemove={() => removeDay(i)}
        />
      ))}

      <button
        type="button"
        onClick={addDay}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-white/10 py-4 text-sm text-muted hover:text-text transition"
      >
        <Plus className="h-5 w-5" />
        Add Day
      </button>

      {error && (
        <div className="rounded-xl border border-danger/20 bg-danger/5 p-3 text-sm text-danger">
          {error}
        </div>
      )}

      <Button
        onClick={handleSave}
        disabled={saving}
        size="lg"
        className="w-full"
      >
        {saving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save className="mr-2 h-4 w-4" />
            Save Routine
          </>
        )}
      </Button>
    </div>
  );
}
