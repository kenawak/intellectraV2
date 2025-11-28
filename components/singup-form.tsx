"use client"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {signIn, signUp} from "@/server/users"
import {z} from "zod";
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import {Loader2} from "lucide-react"
import { authClient } from "@/lib/auth-client"
import Link from "next/link"
import { usePostHog } from "@posthog/react"

const formSchema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(8)
})
export function SignUpForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const posthog = usePostHog();

  const signInWithGoogle = async () => {
    // Track button click
    posthog?.capture('Button Clicked', {
      button_text: 'SignUp with Google',
      section: 'signup',
    });
    
    const data = await authClient.signIn.social({
      provider: "google",
      callbackURL: "/dashboard"
    });
    
    // Identify user and track sign up
    if (data?.user) {
      posthog?.identify(data.user.id, {
        email: data.user.email,
        name: data.user.name,
        role: (data.user as { role?: string })?.role || 'user',
      });
      
      posthog?.capture('User Signed Up', {
        role: (data.user as { role?: string })?.role || 'user',
        plan: 'free',
        method: 'google',
      });
    }
  };
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        name: "",
      email: "",
      password: ""
    },
  })
 
  // 2. Define a submit handler.
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    
    // Track button click
    posthog?.capture('Button Clicked', {
      button_text: 'Sign Up',
      section: 'signup',
    });
    
    const {success, message} = await signUp(values.name, values.email, values.password)
    if(success){
      toast.success(message as string);
      
      // Identify user and track sign up
      const { data: session } = await authClient.getSession();
      if (session?.user) {
        posthog?.identify(session.user.id, {
          email: session.user.email,
          name: session.user.name,
          role: (session.user as { role?: string })?.role || 'user',
        });
        
        posthog?.capture('User Signed Up', {
          role: (session.user as { role?: string })?.role || 'user',
          plan: 'free',
          method: 'email',
        });
      }
      
      router.push("dashboard")
    }
    else{
      toast.error(message as string)
    }
    setIsLoading(false)
  }
  const { data: session, isPending: isSessionLoading } = authClient.useSession();

  useEffect(() => {
    // Only redirect if we have a valid session with a user
    // Wait for session to finish loading before checking
    if (isSessionLoading) return;
    
    // Only redirect if session exists AND has a valid user
    if (session?.user) {
      router.push("/dashboard");
    }
  }, [session, isSessionLoading, router])
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Create your account</CardTitle>
          <CardDescription>
            Enter your email below to create your new account
          </CardDescription>
        </CardHeader>
        <CardContent>
        <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
       
            <div className="flex flex-col gap-6">
            <div className="grid gap-3">
              <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
              </div>
              <div className="grid gap-3">
              <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="email@gmail.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
              </div>
              <div className="grid gap-3">
                <div className="flex flex-col">
                <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input placeholder="**********" type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
                  <Link
                    href="/"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </Link>
                </div>
              </div>
              <div className="flex flex-col gap-3">
              <Button
  type="submit"
  className="w-full"
  disabled={isLoading}
>
  {isLoading ? (
    <Loader2 className="h-4 w-4 animate-spin" />
  ) : (
    "Sign Up"
  )}
</Button>
                <Button variant="outline" className="w-full" type="button" onClick={signInWithGoogle}>
                  SignUp with Google
                </Button>
              </div>
            </div>
            <div className="mt-4 text-center text-sm">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="underline underline-offset-4">
                Sign up
              </Link>
            </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
