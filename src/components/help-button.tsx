import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";

interface HelpButtonProps {
  className?: string;
}

export default function HelpButton({ className }: HelpButtonProps) {
  const handleHelpClick = () => {
    window.location.href = "mailto:abilash.suresh199@gmail.com";
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className={className}
      onClick={handleHelpClick}
      title="Get Help"
    >
      <HelpCircle className="h-5 w-5" />
    </Button>
  );
}
