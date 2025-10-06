import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Construction } from "lucide-react";

interface PlaceholderProps {
  title: string;
  description: string;
}

export default function Placeholder({ title, description }: PlaceholderProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Construction className="h-5 w-5" />
            Coming in Phase 2
          </CardTitle>
          <CardDescription>
            This feature is part of the next development phase
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Phase 1 has established the foundation with authentication, multi-tenant structure, 
            and company management. This feature will be implemented in the next iteration.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
