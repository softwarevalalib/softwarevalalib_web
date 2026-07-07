import { Link } from "react-router-dom";
import { motion } from "framer-motion";

function NotFound() {
  return (
    <section className="min-h-[70vh] flex items-center justify-center section-padding bg-slate-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="section-container max-w-lg text-center"
      >
        <p className="text-8xl sm:text-9xl font-extrabold gradient-text">404</p>
        <h1 className="mt-4 text-2xl sm:text-3xl font-bold text-slate-900">
          Page Not Found
        </h1>
        <p className="mt-4 text-slate-600 text-base sm:text-lg">
          The page you are looking for doesn&apos;t exist or has been moved.
        </p>
        <Link to="/" className="btn-primary mt-8">
          Back to Home
        </Link>
      </motion.div>
    </section>
  );
}

export default NotFound;
