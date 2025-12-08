import React from "react";
import { Link } from "react-router-dom";
import { X, AlertCircle, Info, CheckCircle } from "lucide-react";

/**
 * RegistrationBanner - Customizable top banner for registration status
 *
 * @param {Object} props
 * @param {string} props.status - "open" | "closed" | "limited" | "info"
 * @param {string} props.message - Custom message (optional)
 * @param {string} props.linkText - Text for the link (optional)
 * @param {string} props.linkTo - URL for the link (optional)
 * @param {boolean} props.dismissible - Whether banner can be dismissed
 */
export default function RegistrationBanner({
  status = "open",
  message,
  linkText = "Sign in",
  linkTo = "/login",
  dismissible = false
}) {
  const [isDismissed, setIsDismissed] = React.useState(false);

  if (isDismissed) return null;

  const configs = {
    open: {
      bg: "bg-gradient-to-r from-green-600 to-emerald-600",
      icon: CheckCircle,
      defaultMessage: "New registrations are currently open! Join our growing community.",
      iconColor: "text-green-200"
    },
    closed: {
      bg: "bg-gradient-to-r from-slate-800 to-slate-900",
      icon: AlertCircle,
      defaultMessage: "New registrations are currently closed. Existing members can continue below.",
      iconColor: "text-slate-300"
    },
    limited: {
      bg: "bg-gradient-to-r from-amber-600 to-orange-600",
      icon: Info,
      defaultMessage: "Limited spots available! Register now to secure your place.",
      iconColor: "text-amber-200"
    },
    info: {
      bg: "bg-gradient-to-r from-blue-600 to-indigo-600",
      icon: Info,
      defaultMessage: "Welcome to Builtattic! Create your account to get started.",
      iconColor: "text-blue-200"
    }
  };

  const config = configs[status] || configs.open;
  const Icon = config.icon;
  const displayMessage = message || config.defaultMessage;

  return (
    <div className={`${config.bg} text-white py-3 px-4 relative`}>
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-3">
        <Icon className={`h-5 w-5 ${config.iconColor} flex-shrink-0 hidden sm:block`} />

        <p className="text-sm md:text-base text-center">
          {displayMessage}
          {linkTo && linkText && (
            <>
              {" "}
              <Link
                to={linkTo}
                className="text-white underline font-semibold hover:text-white/80 transition"
              >
                {linkText}
              </Link>
            </>
          )}
        </p>

        {dismissible && (
          <button
            onClick={() => setIsDismissed(true)}
            className="ml-auto p-1 hover:bg-white/10 rounded-lg transition"
            aria-label="Dismiss banner"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

// Example usage variations:

// 1. Registration Open (default)
// <RegistrationBanner status="open" />

// 2. Registration Closed
// <RegistrationBanner
//   status="closed"
//   linkText="Sign in"
//   linkTo="/login"
// />

// 3. Limited Registration
// <RegistrationBanner
//   status="limited"
//   message="Only 50 spots left! Register now to join our exclusive community."
// />

// 4. Custom Info Message
// <RegistrationBanner
//   status="info"
//   message="Early bird registration ends in 3 days. Sign up now for special benefits!"
//   linkText="Learn more"
//   linkTo="/about"
// />

// 5. Dismissible Banner
// <RegistrationBanner
//   status="open"
//   dismissible={true}
// />

// 6. Custom Everything
// <RegistrationBanner
//   status="limited"
//   message="Special offer: First 100 Associates get premium features free!"
//   linkText="View offer details"
//   linkTo="/promo"
//   dismissible={true}
// />
