import React from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Job } from '../types';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  HourglassEmpty as HourglassIcon,
  PlayCircle as PlayCircleIcon,
  Cancel as CancelIcon,
  WifiOff as WifiOffIcon,
  Wifi as WifiIcon,
} from '@mui/icons-material';
import { Chip, Tooltip, LinearProgress } from '@mui/material';

interface JobStatusProps {
  job: Job;
  isConnected: boolean;
}

export const JobStatus: React.FC<JobStatusProps> = ({ job, isConnected }) => {
  const getStatusIcon = () => {
    switch (job.status) {
      case 'queued':
        return <HourglassIcon className="text-gray-400" />;
      case 'running':
        return <PlayCircleIcon className="text-blue-400 animate-pulse" />;
      case 'completed':
        return <CheckCircleIcon className="text-green-400" />;
      case 'failed':
        return <ErrorIcon className="text-red-400" />;
      case 'cancelled':
        return <CancelIcon className="text-orange-400" />;
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (job.status) {
      case 'queued':
        return 'bg-gray-500/20 text-gray-300';
      case 'running':
        return 'bg-blue-500/20 text-blue-300';
      case 'completed':
        return 'bg-green-500/20 text-green-300';
      case 'failed':
        return 'bg-red-500/20 text-red-300';
      case 'cancelled':
        return 'bg-orange-500/20 text-orange-300';
      default:
        return 'bg-gray-500/20 text-gray-300';
    }
  };

  const getDuration = () => {
    if (!job.startedAt) return null;
    const endTime = job.completedAt || new Date();
    const duration = endTime.getTime() - new Date(job.startedAt).getTime();
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-xl p-4"
    >
      <div className="flex items-center justify-between">
        {/* Left Section */}
        <div className="flex items-center space-x-4">
          {/* Status Icon */}
          <div className="flex items-center">
            {getStatusIcon()}
          </div>

          {/* Job Info */}
          <div>
            <div className="flex items-center space-x-3">
              <h3 className="text-lg font-semibold">Job {job.id.slice(0, 8)}</h3>
              <Chip
                label={job.status.toUpperCase()}
                size="small"
                className={getStatusColor()}
              />
              {job.parameters.model && (
                <Chip
                  label={job.parameters.model}
                  size="small"
                  className="bg-purple-500/20 text-purple-300"
                />
              )}
            </div>
            <p className="text-sm text-gray-400 mt-1 line-clamp-1">
              {job.prompt}
            </p>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-4">
          {/* Duration */}
          {getDuration() && (
            <Tooltip title="Execution time">
              <Chip
                label={getDuration()}
                size="small"
                className="bg-dark-hover"
                icon={<HourglassIcon className="text-xs" />}
              />
            </Tooltip>
          )}

          {/* Connection Status */}
          <Tooltip title={isConnected ? 'Connected' : 'Disconnected'}>
            <div>
              {isConnected ? (
                <WifiIcon className="text-green-400" />
              ) : (
                <WifiOffIcon className="text-gray-400" />
              )}
            </div>
          </Tooltip>

          {/* Timestamps */}
          <div className="text-right text-xs text-gray-500">
            <div>Created: {format(new Date(job.createdAt), 'HH:mm:ss')}</div>
            {job.startedAt && (
              <div>Started: {format(new Date(job.startedAt), 'HH:mm:ss')}</div>
            )}
            {job.completedAt && (
              <div>
                Completed: {format(new Date(job.completedAt), 'HH:mm:ss')}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Progress Bar for Running Jobs */}
      {job.status === 'running' && (
        <div className="mt-4">
          <LinearProgress
            variant="indeterminate"
            sx={{
              height: 2,
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              '& .MuiLinearProgress-bar': {
                backgroundColor: 'rgb(59, 130, 246)',
              },
            }}
          />
        </div>
      )}

      {/* Error Message */}
      {job.status === 'failed' && job.error && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-sm text-red-300">{job.error}</p>
        </div>
      )}
    </motion.div>
  );
};