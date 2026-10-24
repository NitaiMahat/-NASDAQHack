import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { currentAccount, LOGIN_URL } from './services/auth';
import './styles.css';
const root=ReactDOM.createRoot(document.getElementById('root')!);
// The trading floor is members-only: no session, no market.
void currentAccount().then(account=>{
 if(!account){location.replace(LOGIN_URL);return;}
 root.render(<React.StrictMode><App account={account}/></React.StrictMode>);
});
