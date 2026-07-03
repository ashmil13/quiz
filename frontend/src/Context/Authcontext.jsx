import { createContext, useState } from "react";

export const AuthContext = createContext()

export const AuthProvider = ({children})=>{

    const [auth,setAuth]=useState({});

    const accessToken = localStorage.getItem("accessToken");
    const email = localStorage.getItem("email");
    const image = localStorage.getItem("profileImage");
    const name = localStorage.getItem("name")
    const role = localStorage.getItem("role");
    const id = localStorage.getItem("userId");

    if (accessToken && role && !auth.accessToken) {
        setAuth({ accessToken, role, email, image, name, id });
    };
    return (
        <AuthContext.Provider value={{ auth, setAuth }}>
            {children}
        </AuthContext.Provider>
    )

}