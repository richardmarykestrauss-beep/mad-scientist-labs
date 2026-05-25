import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

interface Props {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  featureName: string;
}

export function FeaturePlannedDialog({ isOpen, onOpenChange, featureName }: Props) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-md text-center p-6">
        <DialogHeader className="flex flex-col items-center">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/30 grid place-items-center mb-3">
            <Sparkles className="h-6 w-6 text-primary" strokeWidth={2} />
          </div>
          <DialogTitle className="font-display text-xl font-bold">
            {featureName} Planned
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm mt-2">
            This feature is currently scaffolded in the prototype and will be fully integrated in the upcoming database-connected MVP.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 flex justify-center">
          <Button variant="hero" onClick={() => onOpenChange(false)}>
            Understood
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
