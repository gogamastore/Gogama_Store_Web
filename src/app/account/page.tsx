import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { User } from "lucide-react";

export default function AccountPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User />
            My Account
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>This is the user account page. Functionality to be added.</p>
        </CardContent>
      </Card>
    </div>
  );
}
