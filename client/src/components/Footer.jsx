import React from "react";
import { Link } from "react-router-dom";
import { HiOutlineArrowUp } from "react-icons/hi2";

const Footer = () => {
  return (
    <footer className="bg-[#1f1f1f] text-gray-300">
      {/* Back to Top */}
      <div
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="text-center py-3 cursor-pointer text-sm bg-black/30 text-gray-300"
      >
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="inline-flex items-center gap-2 text-gray-300 hover:text-white transition"
          aria-label="Back to Top"
          title="Back to Top"
        >
          <HiOutlineArrowUp className="text-base" />
          <span>Back to Top</span>
        </button>
      </div>

      {/* Footer Links */}
      <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-2 sm:grid-cols-4 gap-8 text-center sm:text-left">
        <div>
          <h3 className="font-semibold text-white mb-4">About Us</h3>
          <ul className="space-y-2 text-sm">
            <li><a href="https://builtattic.info/" className="hover:text-white">Information</a></li>
            <li><a href="https://builtattic.info/" className="hover:text-white">Meet our Team</a></li>
            <li><a href="https://builtattic.info/" className="hover:text-white">Contact Us</a></li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold text-white mb-4">Connect with Us</h3>
          <ul className="space-y-2 text-sm">
            <li><a href="https://www.linkedin.com/company/builltattic" className="hover:text-white">LinkedIn</a></li>
            <li><Link to="/instagram" className="hover:text-white">Instagram</Link></li>
            <li><Link to="/youtube" className="hover:text-white">Youtube</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold text-white mb-4">Join the Platform</h3>
          <ul className="space-y-2 text-sm">
            <li><Link to="/register" className="hover:text-white">Register your Firm</Link></li>
            <li><Link to="/register" className="hover:text-white">Become a Design Associate</Link></li>
            <li><Link to="/register" className="hover:text-white">Advertise your Design</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold text-white mb-4">Help Center</h3>
          <ul className="space-y-2 text-sm">
            <li><Link to="/account" className="hover:text-white">Account</Link></li>
            <li>
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent("support-chat:open"))}
                className="hover:text-white transition text-inherit bg-transparent border-0 outline-none cursor-pointer"
              >
                Chat with us
              </button>
            </li>
            <li><Link to="/faqs" className="hover:text-white">FAQs</Link></li>
          </ul>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-700"></div>

      {/* Bottom Logo/Brand */}
      <div className="text-center py-6">
        <p className="text-white text-lg font-bold tracking-widest" style={{ fontFamily: "Montserrat, sans-serif" }}>
          VitruviAI
        </p>
      </div>
    </footer>
  );
};

export default Footer;
