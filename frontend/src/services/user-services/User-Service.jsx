
import useAxiosPrivate from "../../hooks/useAxiosPrivate";

const UserService = () => {

  const axiosPrivate = useAxiosPrivate()
 // ======================================== register and login ========================================

  const postRegister = async (data) => {
    const response = await axiosPrivate.post("/api/signup", data);
    return response;
  };


  const postLogin = async (data) => {
    const response = await axiosPrivate.post("/api/login", data);
    return response;
  };

  // ======================================== project upload ========================================



  const createProject = async (projectData) => {
    const response = await axiosPrivate.post("/api/projects", projectData);
    return response;
  };

  const getMyProjects = async () => {
    const response = await axiosPrivate.get("/api/projects");
    return response;
  };
  
  const deleteProject = async (projectId) => {
    const response = await axiosPrivate.delete(`/api/projects/${projectId}`);
    return response;
  };
  
  const uploadFile = async (file) => {
    const response = await axiosPrivate.post("/api/upload", file);
    return response;
  };

  return {
    postLogin,
    postRegister,
    uploadFile,
    createProject,
    getMyProjects,
    deleteProject
  };
};

export default UserService;