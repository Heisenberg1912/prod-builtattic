import React from "react";
import { Link } from "react-router-dom";

const RegistrStrip = () => {
  return (
    <div className="bg-black/90 text-gray-200 py-2 text-center text-sm">
      <span className="mr-2">Join now and get 12 months of Operations free on the platform.</span>
      <Link
        to="/register"
        className="underline text-blue-400 hover:text-indigo-200 font-medium"
      >
        Register now
      </Link>
    </div>
  );
};

export default RegistrStrip;