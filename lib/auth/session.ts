import { createBrowserClient } from '@/lib/supabase/client'

export async function login(email:string,password:string){
 const supabase=createBrowserClient()

 const {data,error}=await supabase.auth.signInWithPassword({
  email,
  password
 })

 if(error) throw error
 return data
}

export async function logout(){
 const supabase=createBrowserClient()
 return supabase.auth.signOut()
}

export async function getSession(){
 const supabase=createBrowserClient()
 return supabase.auth.getSession()
}
