import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Logo } from "@/components/lab/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, ShieldCheck, Beaker, Activity } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { dataMode } from "@/lib/supabase";
import { toast } from "sonner";

export default function Login() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [email, setEmail] = useState(dataMode === "supabase" ? "" : "warren@madscientist.lab");
  const [password, setPassword] = useState(dataMode === "supabase" ? "" : "demoaccess");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const profile = await signIn(email, password);
      toast.success("Signed in successfully");
      if (profile.role === "coach" || profile.role === "admin") {
        navigate("/coach");
      } else {
        navigate("/client");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  const handleContinueAsClient = async () => {
    setLoading(true);
    try {
      await signIn("marcus.reign@example.com", "demoaccess");
      toast.success("Signed in as Client (Demo)");
      navigate("/client");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Client demo login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-background text-foreground">
      <div className="absolute inset-0 grid-bg opacity-40" />
      <div className="absolute inset-0 bg-gradient-glow" />
      <div className="relative grid lg:grid-cols-2 min-h-screen">
        <section className="hidden lg:flex flex-col justify-between p-10 border-r border-border">
          <Logo />
          <div className="space-y-6 max-w-lg">
            <span className="chip"><span className="h-1.5 w-1.5 rounded-full bg-primary" /> Premium coaching intelligence</span>
            <h1 className="font-display text-5xl font-bold leading-[1.05] tracking-tight">
              Engineer the <span className="text-primary text-glow">human machine</span>.
            </h1>
            <p className="text-muted-foreground text-lg">
              Coach-to-client training, nutrition, and supplementation built around a real
              <span className="text-foreground"> functional blood chemistry </span> intelligence engine.
            </p>
            <div className="grid grid-cols-3 gap-3 pt-2">
              {[
                { icon: Beaker, label: "Blood Panel Lab" },
                { icon: Activity, label: "Biomarker Trends" },
                { icon: ShieldCheck, label: "Coach-grade RBAC" },
              ].map((f) => (
                <div key={f.label} className="lab-card p-3">
                  <f.icon className="h-4 w-4 text-primary" />
                  <div className="mt-2 text-xs font-medium">{f.label}</div>
                </div>
              ))}
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground max-w-md">
            This platform does not diagnose, treat, or cure disease. Insights are for coaching and educational purposes only.
          </p>
        </section>

        <section className="flex items-center justify-center p-6 sm:p-10">
          <div className="lab-card-glow w-full max-w-md p-8">
            <div className="lg:hidden mb-6"><Logo /></div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-display text-2xl font-bold">Enter the Lab</h2>
                <span className="chip">Pilot</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {dataMode === "supabase" ? "Secure pilot. Use your individual account." : "Demo mode — any credentials work."}
              </p>
            </div>
            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="warren@madscientist.lab"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-background/60"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-background/60"
                  required
                />
              </div>
              <Button type="submit" variant="hero" size="lg" className="w-full group" disabled={loading}>
                {loading ? "Signing in..." : "Sign in"} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </Button>
              {dataMode !== "supabase" && (
                <Button type="button" variant="outline" size="lg" className="w-full" onClick={handleContinueAsClient} disabled={loading}>
                  Continue as Demo Client
                </Button>
              )}
            </form>
            <div className="mt-6 text-[11px] text-muted-foreground text-center">
              By continuing you agree to coaching-use only. Not a medical device.
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
