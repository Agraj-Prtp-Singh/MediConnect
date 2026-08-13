import { useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const Dashboard = () => {
  const { user } = useAuth();

  const [message, setMessage] = useState("");

  useEffect(() => {
    const getUser = async () => {
      try {
        const response = await api.get("/users/me");

        setMessage(response.data.message);

        console.log("Authenticated user:", response.data.user);
      } catch (error) {
        console.error(error);
      }
    };

    getUser();
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 p-10">
      <h1 className="text-3xl font-bold">MediConnect Dashboard</h1>

      <p className="mt-4">Welcome, {user?.name}</p>

      <p className="mt-2 text-green-600">{message}</p>
    </div>
  );
};

export default Dashboard;
