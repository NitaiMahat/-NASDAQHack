export type Account={id:string;email:string;alias:string;balance:number;createdAt:string};
export const LOGIN_URL='/login.html';
export async function currentAccount():Promise<Account|null>{
 try{const response=await fetch('/api/auth/me',{credentials:'same-origin'});if(!response.ok)return null;return ((await response.json()) as {account?:Account}).account??null;}
 catch{return null;}
}
export async function logout(){
 try{await fetch('/api/auth/logout',{method:'POST',credentials:'same-origin'});}catch{/* The login page re-checks the session anyway. */}
 location.replace(LOGIN_URL+'#login');
}
