import { Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function CourierLoginPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-muted/50 px-4">
      <Card className="w-full max-w-sm rounded-lg">
        <CardHeader>
          <Truck className="h-8 w-8 text-accent" />
          <CardTitle>دخول المندوب</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2"><Label>البريد أو رقم الموظف</Label><Input placeholder="QBL-C001" /></div>
          <div className="grid gap-2"><Label>كلمة المرور</Label><Input type="password" /></div>
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90">دخول</Button>
        </CardContent>
      </Card>
    </main>
  );
}
