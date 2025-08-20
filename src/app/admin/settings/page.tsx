import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <Settings />
            Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>This is the settings page. Functionality to be added.</p>
        </CardContent>
      </Card>
    </div>
  );
}
