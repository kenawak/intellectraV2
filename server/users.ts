"use server";
import { auth } from "@/lib/auth"
import { db } from "@/db/drizzle";
import { userprofile } from "@/db/schema";
import { eq } from "drizzle-orm";

export const signIn = async (email: string, password: string) => {
  try{
    await auth.api.signInEmail({
        body: {
            email,
            password
        }
    })
    return {
        success: true,
        message: "Signed IN Successfull"
    }
  }
  catch(error){
    console.log(error)
    const e = error as Error
    return {
        success: false,
        message: e.message || "An unkownk error occured"
    }
  }
}
export const signUp = async (name: string, email: string, password: string) => {
    try {
      const data = await auth.api.signUpEmail({
        body: { name, email, password },
      });
  
      // Create profile linked to user
      await db.insert(userprofile).values({
        id: crypto.randomUUID(),
        userId: data.user.id
      });
  
      return { success: true, message: "Signed Up Successfully" };
    } catch (error) {
      const e = error as Error;
      return { success: false, message: e.message || "An unknown error occurred" };
    }
  };
  export async function createUserprofile(userId: string) {
    return db.insert(userprofile).values({
      id: crypto.randomUUID(),
      userId,
    });
  }