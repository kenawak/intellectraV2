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
import {createUserProfile} from "@/server/users"

const formSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
})
export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();

  const signInWithGoogle = async () => {
    setIsLoading(true);
  
    const data = await authClient.signIn.social({
      provider: "google",
      callbackURL: "/dashboard",
    });
    console.log("data", data)
    // ✅ Server action
    // await createUserProfile(data.user.id);
  
    setIsLoading(false);
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: ""
    },
  })
 
  // 2. Define a submit handler.
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    const {success, message} = await signIn(values.email, values.password)
    if(success){
      toast.success(message as string);
      router.push("dashboard")
    }
    else{
      toast.error(message as string)
    }
    setIsLoading(false)
  }
  useEffect(()=>{
    const checkAuth = async ()=>{
    const {data: session} = await authClient.getSession();
    console.log(session)
    if(session?.user){
      router.push("/dashboard");
    }
  }
  checkAuth()
  })
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Login to your account</CardTitle>
          <CardDescription>
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
        <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
       
            <div className="flex flex-col gap-6">
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
  onClick={()=> setIsLoading(true)}
>
  {isLoading ? (
    <Loader2 className="h-4 w-4 animate-spin" />
  ) : (
    "Login"
  )}
</Button>
                <Button variant="outline" className="w-full" type="button" onClick={signInWithGoogle}>
                {isLoading ? (
    <Loader2 className="h-4 w-4 animate-spin" />
  ) : ( "Login with Google")}
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
