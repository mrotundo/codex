import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useJobStore } from '../stores/jobStore';
import { EventStream } from './EventStream';
import { Terminal } from './Terminal';
import { CodeDisplay } from './CodeDisplay';
import { JobStatus } from './JobStatus';
import { ApprovalDialog } from './ApprovalDialog';
import { UserInputDialog } from './UserInputDialog';
import {
  Tab,
  Tabs,
  Box,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Terminal as TerminalIcon,
  Code as CodeIcon,
  Timeline as TimelineIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
} from '@mui/icons-material';

interface ExecutionViewProps {
  jobId: string;
}

export const ExecutionView: React.FC<ExecutionViewProps> = ({ jobId }) => {
  const {
    currentJob,
    events,
    pendingApproval,
    pendingUserInput,
    isConnected,
    connectToJob,
    disconnectFromJob,
    handleApproval,
    handleUserResponse,
  } = useJobStore();

  // Log events whenever they change
  useEffect(() => {
    console.log(`[ExecutionView] Events updated for job ${jobId}:`, {
      eventCount: events.length,
      eventTypes: events.map(e => e.type),
      isConnected
    });
  }, [events, jobId, isConnected]);

  const [activeTab, setActiveTab] = React.useState(0);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    connectToJob(jobId);
    return () => {
      disconnectFromJob();
    };
  }, [jobId, connectToJob, disconnectFromJob]);

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  if (!currentJob) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-400">Loading job...</div>
      </div>
    );
  }

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-full"
    >
      {/* Job Status Bar */}
      <JobStatus job={currentJob} isConnected={isConnected} />

      {/* Main Content Area */}
      <div className="mt-4 glass rounded-xl overflow-hidden">
        {/* Tab Navigation */}
        <div className="border-b border-dark-border px-4 flex items-center justify-between">
          <Tabs
            value={activeTab}
            onChange={(_, value) => setActiveTab(value)}
            className="flex-1"
            sx={{
              '& .MuiTab-root': {
                color: 'rgb(156, 163, 175)',
                '&.Mui-selected': {
                  color: 'rgb(59, 130, 246)',
                },
              },
              '& .MuiTabs-indicator': {
                backgroundColor: 'rgb(59, 130, 246)',
              },
            }}
          >
            <Tab
              icon={<TimelineIcon className="text-lg" />}
              iconPosition="start"
              label="Event Stream"
            />
            <Tab
              icon={<TerminalIcon className="text-lg" />}
              iconPosition="start"
              label="Terminal Output"
            />
            <Tab
              icon={<CodeIcon className="text-lg" />}
              iconPosition="start"
              label="Code Changes"
            />
          </Tabs>

          {/* Fullscreen Toggle */}
          <Tooltip title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}>
            <IconButton onClick={handleFullscreen} size="small">
              {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
            </IconButton>
          </Tooltip>
        </div>

        {/* Tab Content */}
        <div className="h-[600px] overflow-hidden">
          <Box hidden={activeTab !== 0} className="h-full">
            <EventStream events={events} />
          </Box>
          <Box hidden={activeTab !== 1} className="h-full">
            <Terminal events={events} />
          </Box>
          <Box hidden={activeTab !== 2} className="h-full">
            <CodeDisplay events={events} />
          </Box>
        </div>
      </div>

      {/* Approval Dialog */}
      {pendingApproval && (
        <ApprovalDialog
          approval={pendingApproval}
          onDecision={(decision, comment) => {
            handleApproval(decision, comment);
          }}
        />
      )}

      {/* User Input Dialog */}
      {pendingUserInput && (
        <UserInputDialog
          inputRequest={pendingUserInput}
          onSubmit={(response) => {
            handleUserResponse(response);
          }}
        />
      )}
    </motion.div>
  );
};