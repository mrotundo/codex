import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  IconButton,
  Chip,
  Box,
  LinearProgress,
} from '@mui/material';
import {
  Warning as WarningIcon,
  Close as CloseIcon,
  Check as CheckIcon,
  Block as BlockIcon,
  AllInclusive as AllInclusiveIcon,
  Terminal as TerminalIcon,
  Timer as TimerIcon,
} from '@mui/icons-material';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { ApprovalRequest } from '../types';

interface ApprovalDialogProps {
  approval: ApprovalRequest;
  onDecision: (decision: 'approve' | 'reject' | 'always', comment?: string) => void;
}

export const ApprovalDialog: React.FC<ApprovalDialogProps> = ({
  approval,
  onDecision,
}) => {
  const [comment, setComment] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [autoReject, setAutoReject] = useState(false);

  useEffect(() => {
    // Countdown timer
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setAutoReject(true);
          onDecision('reject', 'Auto-rejected due to timeout');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onDecision]);

  const handleDecision = (decision: 'approve' | 'reject' | 'always') => {
    onDecision(decision, comment || undefined);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        handleDecision('approve');
      } else if (e.key === 'Escape') {
        handleDecision('reject');
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [comment]);

  return (
    <AnimatePresence>
      <Dialog
        open={true}
        maxWidth="md"
        fullWidth
        PaperProps={{
          className: 'bg-dark-surface border border-dark-border',
        }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Header */}
          <DialogTitle className="border-b border-dark-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                >
                  <WarningIcon className="text-accent-warning text-2xl" />
                </motion.div>
                <div>
                  <Typography variant="h6" className="font-semibold">
                    Approval Required
                  </Typography>
                  <Typography variant="caption" className="text-gray-400">
                    The agent wants to execute a command
                  </Typography>
                </div>
              </div>

              {/* Timer */}
              <div className="flex items-center space-x-2">
                <TimerIcon className="text-gray-400 text-sm" />
                <Typography
                  variant="body2"
                  className={countdown < 10 ? 'text-accent-error' : 'text-gray-400'}
                >
                  {countdown}s
                </Typography>
              </div>
            </div>

            {/* Progress bar */}
            <Box sx={{ width: '100%', mt: 1 }}>
              <LinearProgress
                variant="determinate"
                value={(60 - countdown) * (100 / 60)}
                sx={{
                  height: 2,
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: countdown < 10 ? '#ef4444' : '#f59e0b',
                  },
                }}
              />
            </Box>
          </DialogTitle>

          {/* Content */}
          <DialogContent className="space-y-4 py-6">
            {/* Tool Info */}
            <div className="flex items-center space-x-2">
              <TerminalIcon className="text-gray-400" />
              <Chip
                label={approval.tool}
                size="small"
                className="bg-dark-hover"
              />
            </div>

            {/* Command */}
            {approval.command && (
              <div className="space-y-2">
                <Typography variant="body2" className="text-gray-400">
                  Command to execute:
                </Typography>
                <div className="relative">
                  <SyntaxHighlighter
                    language="bash"
                    style={vscDarkPlus}
                    customStyle={{
                      margin: 0,
                      borderRadius: '0.5rem',
                      fontSize: '14px',
                    }}
                  >
                    {approval.command}
                  </SyntaxHighlighter>
                </div>
              </div>
            )}

            {/* Context */}
            <div className="space-y-2">
              <Typography variant="body2" className="text-gray-400">
                Context:
              </Typography>
              <div className="bg-dark-hover rounded-lg p-3">
                <Typography variant="body2" className="text-gray-100">
                  {approval.context}
                </Typography>
              </div>
            </div>

            {/* Comment Field */}
            <TextField
              label="Add comment (optional)"
              multiline
              rows={2}
              fullWidth
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              variant="outlined"
              className="bg-dark-surface"
              InputProps={{
                className: 'text-gray-100',
              }}
              placeholder="Any notes about this decision..."
            />

            {/* Keyboard Shortcuts */}
            <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
              <span>⌘/Ctrl + Enter to approve</span>
              <span>•</span>
              <span>Esc to reject</span>
            </div>
          </DialogContent>

          {/* Actions */}
          <DialogActions className="border-t border-dark-border p-4 space-x-3">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={() => handleDecision('reject')}
                variant="outlined"
                color="error"
                startIcon={<BlockIcon />}
              >
                Reject
              </Button>
            </motion.div>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={() => handleDecision('always')}
                variant="outlined"
                startIcon={<AllInclusiveIcon />}
                className="border-accent-secondary text-accent-secondary
                         hover:bg-accent-secondary/10 hover:border-accent-secondary"
              >
                Always Allow
              </Button>
            </motion.div>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={() => handleDecision('approve')}
                variant="contained"
                color="primary"
                startIcon={<CheckIcon />}
                className="bg-gradient-to-r from-accent-primary to-blue-600"
              >
                Approve Once
              </Button>
            </motion.div>
          </DialogActions>
        </motion.div>
      </Dialog>
    </AnimatePresence>
  );
};