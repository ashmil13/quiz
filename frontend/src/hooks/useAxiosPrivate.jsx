import { useEffect } from "react";
// import Swal from "sweetalert2";
import useAuth from "./useAuth";
import { axiosPrivate } from "../axios";
// import { genericError } from "../utils/genericError";


const useAxiosPrivate = () => {
    const authContext = useAuth();
    const auth = authContext?.auth || {};
    const setAuth = authContext?.setAuth || (() => {});
    useEffect(() => {
        axiosPrivate.interceptors.request.use(
            config => {
                if (config.data instanceof FormData) {
                    config.headers["Content-Type"] = "multipart/form-data";
                  } else {
                    config.headers["Content-Type"] = "application/json";
                  }

                if (!config.headers['Authorization']) {
                    const token = localStorage.getItem("accessToken");
                    if (token) {
                        config.headers['Authorization'] = token;
                    }
                }

                return config;
            },
            error => {
                return Promise.reject(error)
            }
        );

        axiosPrivate.interceptors.response.use(
            response => {
                return response
            },
           async error => {

            // genericError(error)


                return Promise.reject(error)
            }
        );
    }, [auth])

    return axiosPrivate
}

export default useAxiosPrivate;
