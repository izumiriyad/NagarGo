const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";
export async function api<T>(path:string, options:RequestInit={}) : Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("nagargo_access_token") : null;
  const headers = new Headers(options.headers); headers.set("Content-Type","application/json"); if(token) headers.set("Authorization",`Bearer ${token}`);
  const res=await fetch(`${API}${path}`,{...options,headers,cache:"no-store"}); const data=await res.json().catch(()=>({})); if(!res.ok) throw new Error(data.message??"Request failed"); return data;
}
export function saveSession(accessToken:string){ localStorage.setItem("nagargo_access_token",accessToken); }
