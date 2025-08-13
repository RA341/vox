import {BrowserRouter, Navigate, Outlet, Route, Routes} from "react-router-dom";
import React, {useEffect, useState} from 'react';
import {LoginScreen} from "./pages/login.tsx";
import {SignupScreen} from "./pages/signup.tsx";
import VoxApp from "./pages/home.tsx";
import api from "./lib/api.ts";

export function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="login" element={<LoginScreen/>}/>
                <Route path="signup" element={<SignupScreen/>}/>

                <Route element={<PrivateRoute/>}>
                    <Route path="/" element={<VoxApp/>}/>
                </Route>
                {/*todo*/}
                {/*<Route path="/not-found" element={<NotFoundPage/>}/>*/}
                {/*<Route path="*" element={<NotFoundPage/>}/>*/}
            </Routes>
        </BrowserRouter>
    );
}

const PrivateRoute = () => {
    const [isLoading, setIsLoading] = useState(true)
    const [authed, setAuthed] = useState(false)

    useEffect(() => {
        setIsLoading(true)

        api.pingApiPingGet().then(() => {
            setAuthed(true)
        }).catch((err: any) => {
            console.error(`unable to verify auth status ${err}`)
            setAuthed(false)
        }).finally(() => {
            setIsLoading(false)
        })

    }, []);

    if (isLoading) {
        return (
            <div style={loadingPageStyle.loadingWrapper}>
                <div style={loadingPageStyle.spinner}></div>
                <p style={loadingPageStyle.loadingText}>Verifying your session...</p>
            </div>
        )
    }

    // todo
    if (!authed) {
        return <Navigate to="/login"/>
    }

    return (
        <Outlet/>
    );
};

const loadingPageStyle: { [key: string]: React.CSSProperties } = {
    loadingWrapper: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontFamily: 'sans-serif',
    },
    spinner: {
        border: '4px solid rgba(0, 0, 0, 0.1)',
        width: '36px',
        height: '36px',
        borderRadius: '50%',
        borderLeftColor: '#09f', // Or your brand color
        animation: 'spin 1s ease infinite',
        marginBottom: '20px',
    },
    loadingText: {
        fontSize: '1.1rem',
        color: '#555',
    }
};


export default App