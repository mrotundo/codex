import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useJobStore } from '../stores/jobStore';
import { ExecutionView } from '../components/ExecutionView';
import {
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

const JobPage: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { currentJob, isLoading, error, loadJob, clearError } = useJobStore();

  useEffect(() => {
    if (jobId) {
      loadJob(jobId);
    }
  }, [jobId, loadJob]);

  useEffect(() => {
    // Clear error when component unmounts
    return () => {
      clearError();
    };
  }, [clearError]);

  if (!jobId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert severity="error">No job ID provided</Alert>
      </div>
    );
  }

  if (isLoading && !currentJob) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-96">
          <CircularProgress />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto"
        >
          <Alert 
            severity="error" 
            className="mb-4"
            action={
              <Button
                color="inherit"
                size="small"
                onClick={() => loadJob(jobId)}
                startIcon={<RefreshIcon />}
              >
                Retry
              </Button>
            }
          >
            {error}
          </Alert>
          <Button
            onClick={() => navigate('/')}
            startIcon={<ArrowBackIcon />}
            variant="outlined"
          >
            Back to Home
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <Button
          onClick={() => navigate('/jobs')}
          startIcon={<ArrowBackIcon />}
          className="text-gray-400 hover:text-gray-100"
        >
          Back to Jobs
        </Button>
      </motion.div>

      {/* Execution View */}
      <ExecutionView jobId={jobId} />
    </div>
  );
};

export default JobPage;