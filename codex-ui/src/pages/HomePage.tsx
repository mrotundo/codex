import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { JobSubmitter } from '../components/JobSubmitter';

const HomePage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold mb-2">New Job</h1>
        <p className="text-gray-400">Submit a task for the AI agent to execute</p>
      </motion.div>

      {/* Job Submitter */}
      <JobSubmitter />

      {/* Quick Links */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex items-center justify-between mt-8 pt-8 border-t border-dark-border"
      >
        <Link
          to="/jobs"
          className="text-accent-primary hover:text-accent-secondary transition-colors"
        >
          View all jobs →
        </Link>
      </motion.div>
    </div>
  );
};

export default HomePage;