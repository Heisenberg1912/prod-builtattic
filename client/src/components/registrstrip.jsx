import { Link } from "react-router-dom";

const RegistrStrip = () => {
  return (
    <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-gray-100 py-2.5 text-center text-sm shadow-md">
      <span className="mr-2">New registrations are now open! Join our platform today.</span>
      <Link
        to="/register"
        className="underline text-emerald-400 hover:text-emerald-300 font-semibold"
      >
        Sign up
      </Link>
      <span className="mx-2 text-gray-400">|</span>
      <Link
        to="/login"
        className="underline text-blue-400 hover:text-blue-300 font-medium"
      >
        Sign in
      </Link>
    </div>
  );
};

export default RegistrStrip;
