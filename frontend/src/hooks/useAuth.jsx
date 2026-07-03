import { useContext } from "react"
import { AuthContext } from "../Context/Authcontext"

const useAuth = () => {
    return useContext(AuthContext)
}

export default useAuth