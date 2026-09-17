import { Link } from "react-router-dom";

function Login() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <h1 className="text-3xl font-bold text-navy">
        Adoptly Login
      </h1>

      <Link
        to="/register"
        className="text-blue-600 hover:underline"
      >
        Create an account
      </Link>

      <Link
        to="/adopter-dashboard"
        className="text-blue-600 hover:underline"
      >
        Go to Dashboard
      </Link>
    </div>
  );
}

export default Login;