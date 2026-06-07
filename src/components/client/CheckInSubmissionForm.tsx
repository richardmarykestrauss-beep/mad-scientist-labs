import { useState } from "react";
import { actions } from "@/data/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ClipboardCheck, Sparkles, Smile, BatteryCharging, Moon, AlertOctagon } from "lucide-react";

interface Props {
  clientId: string;
  onSubmitSuccess?: () => void;
}

export function CheckInSubmissionForm({ clientId, onSubmitSuccess }: Props) {
  const [weight, setWeight] = useState("");
  const [energy, setEnergy] = useState(7);
  const [sleep, setSleep] = useState(7);
  const [mood, setMood] = useState(7);
  const [stress, setStress] = useState(5);
  const [training, setTraining] = useState(90);
  const [nutrition, setNutrition] = useState(90);
  const [digestion, setDigestion] = useState("");
  const [wins, setWins] = useState("");
  const [struggles, setStruggles] = useState("");
  const [question, setQuestion] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const weightNum = parseFloat(weight);
    if (isNaN(weightNum) || weightNum <= 0) {
      toast.error("Please enter a valid body weight");
      return;
    }

    actions.addCheckIn(
      clientId,
      weightNum,
      energy,
      sleep,
      mood,
      stress,
      training,
      nutrition,
      digestion || "No notes",
      wins || "None",
      struggles || "None",
      question || "None"
    );

    toast.success("Weekly check-in submitted successfully!");
    if (onSubmitSuccess) {
      onSubmitSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto pb-10">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-5 shadow-md">
        <div className="flex items-center gap-2 border-b border-zinc-800/80 pb-3">
          <ClipboardCheck className="h-5 w-5 text-emerald-400" />
          <h2 className="font-display text-lg font-bold text-white">Weekly Performance Reflection</h2>
        </div>
        <p className="text-xs text-zinc-400 leading-relaxed">
          Submit your check-in metrics. Your coach will review your bio-markers, bio-feedback, and adherence trends to update your protocol.
        </p>

        {/* Step 1: Weight & Biofeedback */}
        <div className="space-y-4 pt-2">
          <h3 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider font-sans">1. Biometrics & Bio-feedback</h3>
          
          <div className="space-y-1.5">
            <Label htmlFor="weight" className="text-zinc-300">Current Body Weight (kg)</Label>
            <Input
              id="weight"
              type="number"
              step="0.1"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="e.g. 92.4"
              required
              className="bg-zinc-950/40 border-zinc-850 focus-visible:ring-emerald-500/50 text-zinc-200"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4 pt-2">
            {/* Energy Slider */}
            <div className="space-y-2 rounded-xl border border-zinc-850/60 bg-zinc-950/20 p-3">
              <div className="flex justify-between items-center text-xs">
                <span className="flex items-center gap-1.5 text-zinc-300"><BatteryCharging className="h-3.5 w-3.5 text-emerald-400" /> Energy Level</span>
                <span className="font-sans text-emerald-400 font-semibold text-xs">{energy}/10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={energy}
                onChange={(e) => setEnergy(parseInt(e.target.value))}
                className="w-full accent-emerald-500 bg-zinc-900 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-zinc-500">
                <span>Exhausted</span>
                <span>Elite</span>
              </div>
            </div>

            {/* Sleep Slider */}
            <div className="space-y-2 rounded-xl border border-zinc-850/60 bg-zinc-950/20 p-3">
              <div className="flex justify-between items-center text-xs">
                <span className="flex items-center gap-1.5 text-zinc-300"><Moon className="h-3.5 w-3.5 text-emerald-400" /> Sleep Quality</span>
                <span className="font-sans text-emerald-400 font-semibold text-xs">{sleep}/10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={sleep}
                onChange={(e) => setSleep(parseInt(e.target.value))}
                className="w-full accent-emerald-500 bg-zinc-900 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-zinc-500">
                <span>Insomnia</span>
                <span>Restful</span>
              </div>
            </div>

            {/* Mood Slider */}
            <div className="space-y-2 rounded-xl border border-zinc-850/60 bg-zinc-950/20 p-3">
              <div className="flex justify-between items-center text-xs">
                <span className="flex items-center gap-1.5 text-zinc-300"><Smile className="h-3.5 w-3.5 text-emerald-400" /> Mood & Focus</span>
                <span className="font-sans text-emerald-400 font-semibold text-xs">{mood}/10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={mood}
                onChange={(e) => setMood(parseInt(e.target.value))}
                className="w-full accent-emerald-500 bg-zinc-900 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-zinc-500">
                <span>Depressed</span>
                <span>Excellent</span>
              </div>
            </div>

            {/* Stress Slider */}
            <div className="space-y-2 rounded-xl border border-zinc-850/60 bg-zinc-950/20 p-3">
              <div className="flex justify-between items-center text-xs">
                <span className="flex items-center gap-1.5 text-zinc-300"><AlertOctagon className="h-3.5 w-3.5 text-emerald-400" /> Perception of Stress</span>
                <span className="font-sans text-emerald-400 font-semibold text-xs">{stress}/10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={stress}
                onChange={(e) => setStress(parseInt(e.target.value))}
                className="w-full accent-emerald-500 bg-zinc-900 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-zinc-500">
                <span>None</span>
                <span>Burnout</span>
              </div>
            </div>
          </div>
        </div>

        {/* Step 2: Adherence */}
        <div className="space-y-4 pt-4 border-t border-zinc-800/80">
          <h3 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider font-sans">2. Weekly Adherence Rates</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2 rounded-xl border border-zinc-850/60 bg-zinc-950/20 p-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-300">Training Compliance</span>
                <span className="font-sans text-emerald-400 font-semibold text-xs">{training}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={training}
                onChange={(e) => setTraining(parseInt(e.target.value))}
                className="w-full accent-emerald-500 bg-zinc-900 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div className="space-y-2 rounded-xl border border-zinc-850/60 bg-zinc-950/20 p-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-300">Nutrition Compliance</span>
                <span className="font-sans text-emerald-400 font-semibold text-xs">{nutrition}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={nutrition}
                onChange={(e) => setNutrition(parseInt(e.target.value))}
                className="w-full accent-emerald-500 bg-zinc-900 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Step 3: Reflections */}
        <div className="space-y-4 pt-4 border-t border-zinc-800/80">
          <h3 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider font-sans">3. Digest & Reflection</h3>
          
          <div className="space-y-1.5">
            <Label htmlFor="digestion" className="text-zinc-300">Digestion & Gut Health Notes</Label>
            <Textarea
              id="digestion"
              value={digestion}
              onChange={(e) => setDigestion(e.target.value)}
              placeholder="e.g. Any bloating, stools frequency, indigestion issues..."
              className="bg-zinc-950/40 border-zinc-850 focus-visible:ring-emerald-500/50 text-zinc-200 min-h-[70px] rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="wins" className="text-zinc-300">Wins This Week</Label>
            <Textarea
              id="wins"
              value={wins}
              onChange={(e) => setWins(e.target.value)}
              placeholder="What went well? Energy, lifts, consistency..."
              className="bg-zinc-950/40 border-zinc-850 focus-visible:ring-emerald-500/50 text-zinc-200 min-h-[70px] rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="struggles" className="text-zinc-300">Struggles & Bottlenecks</Label>
            <Textarea
              id="struggles"
              value={struggles}
              onChange={(e) => setStruggles(e.target.value)}
              placeholder="What did you struggle with? Sleep bottlenecks, skipped sessions, stress..."
              className="bg-zinc-950/40 border-zinc-850 focus-visible:ring-emerald-500/50 text-zinc-200 min-h-[70px] rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="question" className="text-zinc-300">Question for Coach</Label>
            <Textarea
              id="question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Anything specific you'd like your coach to answer?"
              className="bg-zinc-950/40 border-zinc-850 focus-visible:ring-emerald-500/50 text-zinc-200 min-h-[70px] rounded-xl"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-zinc-800/80 flex justify-end">
          <Button 
            type="submit" 
            className="w-full sm:w-auto font-semibold rounded-xl text-xs h-10 px-5 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 transition-colors flex items-center justify-center gap-1.5"
          >
            <Sparkles className="h-4 w-4" /> Submit Weekly Check-in
          </Button>
        </div>
      </div>
    </form>
  );
}
