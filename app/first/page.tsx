"use client"
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {toast} from "sonner" 
export default function Dashboard() {
  const router = useRouter();

  const signOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/login"); // redirect to login page
        },
      },
    });
  };
  const deleteAccount = async () => {
    try{
      await authClient.deleteUser({
        callbackURL: "/" 
    });
    toast.success("Account deleted")
    }
    catch(error){
        const e = error as Error
      toast.error(e.message)
    }}
  const handleCheckout = async (productId?: string, slug?: string) => {
    await authClient.checkout({
      ...(productId && { products: [productId] }),
      ...(slug && { slug }),
    });
  };

  return (
    <div className="p-6 space-y-8">
      {/* Dashboard Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="space-x-2">
          <Button type="button" variant="default" onClick={signOut}>
            Sign out
          </Button>
          <Button type="button" variant="destructive" onClick={deleteAccount}>
            Delete Account
          </Button>
        </div>
      </div>

      {/* Product Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Freemium */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Freemium</CardTitle>
            <CardDescription>
              Get started with basic features, free forever.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full"
              variant="secondary"
              onClick={() => handleCheckout("88c88042-ede8-4290-8e6e-b96291bf4c87")}
            >
              Use for Free
            </Button>
          </CardContent>
        </Card>

        {/* Starter */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Starter Plan</CardTitle>
            <CardDescription>
              Great for individuals just starting out.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full"
              onClick={() => handleCheckout("bd530514-b794-4ff8-be2a-db124809570b")}
            >
              Purchase Starter
            </Button>
          </CardContent>
        </Card>

        {/* Pro */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Pro Plan</CardTitle>
            <CardDescription>
              Unlock premium features with the Pro plan.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full"
              onClick={() =>
                handleCheckout("pro")
              }
            >
              Purchase Pro
            </Button>
          </CardContent>
        </Card>

        {/* Enterprise */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Enterprise Plan</CardTitle>
            <CardDescription>
              Custom features for growing teams and businesses.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full"
              onClick={() => handleCheckout(undefined, "enterprise")}
            >
              Purchase Enterprise
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
