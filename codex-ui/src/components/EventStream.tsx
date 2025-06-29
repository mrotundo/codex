import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Event, EventType } from '../types';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Psychology as PsychologyIcon,
  Terminal as TerminalIcon,
  Code as CodeIcon,
  Warning as WarningIcon,
  HourglassEmpty as HourglassIcon,
  AutoAwesome as AutoAwesomeIcon,
} from '@mui/icons-material';

interface EventStreamProps {
  events: Event[];
}

const getEventIcon = (type: EventType) => {
  switch (type) {
    case EventType.JOB_STARTED:
      return <AutoAwesomeIcon className="text-accent-primary" />;
    case EventType.JOB_COMPLETED:
      return <CheckCircleIcon className="text-accent-success" />;
    case EventType.JOB_FAILED:
      return <ErrorIcon className="text-accent-error" />;
    case EventType.AGENT_THINKING:
      return <PsychologyIcon className="text-accent-secondary animate-pulse" />;
    case EventType.AGENT_MESSAGE:
      return <InfoIcon className="text-blue-400" />;
    case EventType.TOOL_EXECUTING:
      return <TerminalIcon className="text-yellow-400" />;
    case EventType.TOOL_COMPLETED:
      return <CheckCircleIcon className="text-green-400" />;
    case EventType.APPROVAL_REQUIRED:
      return <WarningIcon className="text-accent-warning animate-pulse" />;
    case EventType.FILE_CHANGED:
      return <CodeIcon className="text-purple-400" />;
    default:
      return <InfoIcon className="text-gray-400" />;
  }
};

const getEventColor = (type: EventType) => {
  switch (type) {
    case EventType.JOB_FAILED:
    case EventType.TOOL_FAILED:
      return 'border-accent-error/50 bg-accent-error/10';
    case EventType.JOB_COMPLETED:
    case EventType.TOOL_COMPLETED:
      return 'border-accent-success/50 bg-accent-success/10';
    case EventType.APPROVAL_REQUIRED:
      return 'border-accent-warning/50 bg-accent-warning/10';
    case EventType.AGENT_THINKING:
      return 'border-accent-secondary/50 bg-accent-secondary/10';
    default:
      return 'border-dark-border bg-dark-surface/50';
  }
};

export const EventStream: React.FC<EventStreamProps> = ({ events }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-scroll to bottom when new events arrive
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [events]);

  return (
    <div className="h-full overflow-y-auto p-4 space-y-3">
      <AnimatePresence>
        {events.map((event, index) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className={`
              relative flex items-start space-x-3 p-4 rounded-lg border
              ${getEventColor(event.type)}
              transition-all duration-200 hover:shadow-lg
            `}
          >
            {/* Icon */}
            <div className="flex-shrink-0 mt-1">
              {getEventIcon(event.type)}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Event Type and Time */}
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-300">
                  {event.type.replace('.', ' ').replace(/_/g, ' ').toUpperCase()}
                </span>
                <span className="text-xs text-gray-500">
                  {format(new Date(event.timestamp), 'HH:mm:ss')}
                </span>
              </div>

              {/* Event Data */}
              <div className="text-sm text-gray-100">
                {event.type === EventType.AGENT_MESSAGE && (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    className="prose prose-sm prose-invert max-w-none"
                    components={{
                      code: ({ inline, children }) =>
                        inline ? (
                          <code className="bg-gray-800 px-1 py-0.5 rounded text-xs">
                            {children}
                          </code>
                        ) : (
                          <pre className="bg-gray-900 p-2 rounded overflow-x-auto">
                            <code className="text-xs">{children}</code>
                          </pre>
                        ),
                    }}
                  >
                    {event.data.content}
                  </ReactMarkdown>
                )}

                {event.type === EventType.TOOL_EXECUTING && (
                  <div>
                    <div className="font-mono text-yellow-400 mb-1">
                      {event.data.tool}: {event.data.command}
                    </div>
                    {event.data.context && (
                      <div className="text-gray-400 text-xs">{event.data.context}</div>
                    )}
                  </div>
                )}

                {event.type === EventType.STDOUT && (
                  <pre className="font-mono text-xs bg-black p-2 rounded overflow-x-auto text-green-400">
                    {event.data.content}
                  </pre>
                )}

                {event.type === EventType.STDERR && (
                  <pre className="font-mono text-xs bg-black p-2 rounded overflow-x-auto text-red-400">
                    {event.data.content}
                  </pre>
                )}

                {event.type === EventType.FILE_CHANGED && (
                  <div>
                    <div className="font-mono text-purple-400 mb-1">
                      {event.data.action} {event.data.path}
                    </div>
                    {event.data.diff && (
                      <pre className="text-xs bg-gray-900 p-2 rounded overflow-x-auto">
                        <code className="language-diff">{event.data.diff}</code>
                      </pre>
                    )}
                  </div>
                )}

                {event.type === EventType.APPROVAL_REQUIRED && (
                  <div className="bg-accent-warning/20 p-3 rounded">
                    <div className="font-medium mb-1">Approval Required</div>
                    <div className="text-xs text-gray-300">
                      Tool: {event.data.tool}
                      {event.data.command && (
                        <div className="font-mono mt-1">{event.data.command}</div>
                      )}
                    </div>
                  </div>
                )}

                {event.type === EventType.AGENT_THINKING && (
                  <div className="flex items-center space-x-2">
                    <span>{event.data.message}</span>
                    <span className="loading-dots text-accent-secondary"></span>
                  </div>
                )}

                {(event.type === EventType.JOB_STARTED ||
                  event.type === EventType.JOB_COMPLETED ||
                  event.type === EventType.JOB_FAILED) && (
                  <div className="font-medium">
                    {event.type === EventType.JOB_STARTED && 'Job execution started'}
                    {event.type === EventType.JOB_COMPLETED && 'Job completed successfully'}
                    {event.type === EventType.JOB_FAILED && `Job failed: ${event.data.error}`}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
      <div ref={bottomRef} />
    </div>
  );
};