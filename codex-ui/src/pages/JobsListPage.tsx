import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { useJobStore } from '../stores/jobStore';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Button,
  CircularProgress,
  Tooltip,
  TablePagination,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  HourglassEmpty as HourglassIcon,
  PlayCircle as PlayCircleIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';

const JobsListPage: React.FC = () => {
  const navigate = useNavigate();
  const { jobs, totalJobs, isLoading, loadJobs } = useJobStore();
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);

  useEffect(() => {
    loadJobs(rowsPerPage, page * rowsPerPage);
  }, [loadJobs, page, rowsPerPage]);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'queued':
        return <HourglassIcon className="text-gray-400" />;
      case 'running':
        return <PlayCircleIcon className="text-blue-400" />;
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'queued':
        return 'default';
      case 'running':
        return 'primary';
      case 'completed':
        return 'success';
      case 'failed':
        return 'error';
      case 'cancelled':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Jobs</h1>
            <p className="text-gray-400">View and manage all Codex jobs</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              onClick={() => loadJobs(rowsPerPage, page * rowsPerPage)}
              startIcon={<RefreshIcon />}
              variant="outlined"
              disabled={isLoading}
            >
              Refresh
            </Button>
            <Button
              onClick={() => navigate('/')}
              startIcon={<AddIcon />}
              variant="contained"
              className="bg-gradient-to-r from-accent-primary to-accent-secondary"
            >
              New Job
            </Button>
          </div>
        </div>

        {/* Jobs Table */}
        <TableContainer component={Paper} className="glass rounded-xl">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Status</TableCell>
                <TableCell>Job ID</TableCell>
                <TableCell>Prompt</TableCell>
                <TableCell>Model</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Duration</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading && jobs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" className="py-8">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : jobs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" className="py-8">
                    <div className="text-gray-400">
                      <p className="text-lg mb-2">No jobs yet</p>
                      <Button
                        onClick={() => navigate('/')}
                        startIcon={<AddIcon />}
                        variant="outlined"
                      >
                        Create First Job
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                jobs.map((job) => {
                  const duration = job.startedAt && job.completedAt
                    ? Math.floor((new Date(job.completedAt).getTime() - new Date(job.startedAt).getTime()) / 1000)
                    : null;

                  return (
                    <TableRow
                      key={job.id}
                      hover
                      className="cursor-pointer"
                      onClick={() => navigate(`/jobs/${job.id}`)}
                    >
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(job.status)}
                          <Chip
                            label={job.status}
                            size="small"
                            color={getStatusColor(job.status) as any}
                            className="capitalize"
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-dark-hover px-2 py-1 rounded">
                          {job.id.slice(0, 8)}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Tooltip title={job.prompt}>
                          <div className="max-w-xs truncate">
                            {job.prompt}
                          </div>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        {job.parameters.model && (
                          <Chip
                            label={job.parameters.model}
                            size="small"
                            className="bg-purple-500/20 text-purple-300"
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        {format(new Date(job.createdAt), 'MMM d, HH:mm')}
                      </TableCell>
                      <TableCell>
                        {duration !== null ? `${duration}s` : '-'}
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/jobs/${job.id}`);
                          }}
                          size="small"
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
          
          {/* Pagination */}
          <TablePagination
            component="div"
            count={totalJobs}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25, 50]}
            className="border-t border-dark-border"
          />
        </TableContainer>
      </motion.div>
    </div>
  );
};

export default JobsListPage;