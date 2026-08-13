import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const Login = () => {
  const { setUser } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setError("");

      const response = await api.post("/auth/login", formData);

      const { token, user } = response.data;

      localStorage.setItem("token", token);

      setUser(user);

      console.log("Logged in:", user);
    } catch (error) {
      setError(error.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-xl bg-white p-8 shadow"
      >
        <h1 className="mb-6 text-3xl font-bold">Login</h1>

        {error && <p className="mb-4 text-red-500">{error}</p>}

        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          className="mb-4 w-full rounded-lg border p-3"
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          className="mb-6 w-full rounded-lg border p-3"
        />

        <button
          type="submit"
          className="w-full rounded-lg bg-blue-600 p-3 font-semibold text-white"
        >
          Login
        </button>
      </form>
    </div>
  );
};

export default Login;
