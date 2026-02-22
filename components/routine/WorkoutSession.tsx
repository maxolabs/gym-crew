"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CircuitCard } from "./CircuitCard";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { CheckCircle, Loader2, Calendar, Trophy } from "lucide-react";
import type { ActiveRoutine, RoutineDay } from "@/lib/routine";

type Props = {
  groupId: string;
  routine: ActiveRoutine;
  day: RoutineDay;
  currentWeek: number;
  userId: string;
};

export function WorkoutSession({ groupId, routine, day, currentWeek, userId }: Props) {
  const supabase = supabaseBrowser();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [xpAwarded, setXpAwarded] = useState(0);
  const [starting, setStarting] = useState(true);

  const startSession = useCallback(async () => {
    setStarting(true);
    const { data, error } = await supabase.rpc("start_routine_session", {
      p_routine_id: routine.id,
      p_day_id: day.id,
      p_week_number: currentWeek,
    });

    if (data && !error) {
      setSessionId(data as string);

      // Check if already completed
      const { data: session } = await supabase
        .from("routine_sessions")
        .select("completed_at")
        .eq("id", data)
        .single();

      if (session?.completed_at) {
        setCompleted(true);
      }
    }
    setStarting(false);
  }, [supabase, routine.id, day.id, currentWeek]);

  useEffect(() => {
    startSession();
  }, [startSession]);

  async function handleComplete() {
    if (!sessionId) return;
    setCompleting(true);

    const { data, error } = await supabase.rpc("complete_routine_session", {
      p_session_id: sessionId,
    });

    if (data && !error) {
      const result = data as any;
      setCompleted(true);
      setXpAwarded(result.xp_awarded ?? 20);
    }
    setCompleting(false);
  }

  if (starting) {
    return (
      <Card className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted" />
      </Card>
    );
  }

  if (completed) {
    return (
      <Card className="space-y-4 text-center">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
            <Trophy className="h-8 w-8 text-success" />
          </div>
        </div>
        <div>
          <CardTitle>Workout Complete!</CardTitle>
          <p className="mt-1 text-sm text-muted">
            {xpAwarded > 0 && `+${xpAwarded} XP earned`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            href={`/g/${groupId}/routine/history`}
            variant="secondary"
            className="flex-1"
          >
            History
          </Button>
          <Button href={`/g/${groupId}`} className="flex-1">
            Dashboard
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs text-muted">
        <Calendar className="h-3.5 w-3.5" />
        <span>
          Week {currentWeek} of {routine.total_weeks}
        </span>
      </div>

      {day.circuits.map((circuit) => (
        <CircuitCard key={circuit.id} circuit={circuit} currentWeek={currentWeek} />
      ))}

      <Button
        onClick={handleComplete}
        disabled={completing}
        size="lg"
        className="w-full"
      >
        {completing ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Completing...
          </>
        ) : (
          <>
            <CheckCircle className="mr-2 h-5 w-5" />
            Complete Workout
          </>
        )}
      </Button>
    </div>
  );
}
