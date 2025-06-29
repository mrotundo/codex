import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import {
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Collapse,
  IconButton,
  Chip,
  FormHelperText,
  CircularProgress,
} from '@mui/material';
import {
  Send as SendIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  AutoAwesome as AutoAwesomeIcon,
  Code as CodeIcon,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import { useJobStore } from '../stores/jobStore';

interface FormData {
  prompt: string;
  model: string;
  approvalMode: 'suggest' | 'auto-edit' | 'full-auto';
  reasoningEffort: 'low' | 'medium' | 'high';
  projectType?: string;
  additionalInstructions?: string;
}

const models = [
  { value: 'gpt-4', label: 'GPT-4', icon: '🧠' },
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo', icon: '⚡' },
  { value: 'o1-preview', label: 'O1 Preview', icon: '🔬' },
  { value: 'claude-3', label: 'Claude 3', icon: '🤖' },
];

const approvalModes = [
  { value: 'suggest', label: 'Suggest (Manual Approval)', description: 'Review each action' },
  { value: 'auto-edit', label: 'Auto-edit (File Changes Only)', description: 'Auto-approve file edits' },
  { value: 'full-auto', label: 'Full Auto (Sandboxed)', description: 'Fully autonomous execution' },
];

const projectTypes = [
  'react-typescript',
  'node-express',
  'python-django',
  'rust',
  'go',
  'other',
];

export const JobSubmitter: React.FC = () => {
  const navigate = useNavigate();
  const createJob = useJobStore((state) => state.createJob);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    defaultValues: {
      model: 'gpt-4',
      approvalMode: 'suggest',
      reasoningEffort: 'medium',
    },
  });

  const watchModel = watch('model');
  const watchApprovalMode = watch('approvalMode');

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const parameters: any = {
        model: data.model,
        approvalMode: data.approvalMode,
        reasoningEffort: data.reasoningEffort,
      };

      if (data.projectType || data.additionalInstructions) {
        parameters.context = {
          projectType: data.projectType,
          additionalInstructions: data.additionalInstructions,
        };
      }

      const jobId = await createJob(data.prompt, parameters);
      toast.success('Job created successfully!');
      reset();
      navigate(`/jobs/${jobId}`);
    } catch (error) {
      toast.error('Failed to create job');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-4xl mx-auto"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Main Prompt Input */}
        <div className="glass rounded-xl p-6 space-y-4">
          <div className="flex items-center space-x-3 mb-4">
            <AutoAwesomeIcon className="text-accent-primary text-2xl" />
            <h2 className="text-xl font-semibold">Create New Job</h2>
          </div>

          <TextField
            {...register('prompt', { 
              required: 'Prompt is required',
              minLength: { value: 10, message: 'Prompt must be at least 10 characters' },
              maxLength: { value: 10000, message: 'Prompt must be less than 10000 characters' }
            })}
            label="What would you like Codex to do?"
            multiline
            rows={4}
            fullWidth
            error={!!errors.prompt}
            helperText={errors.prompt?.message}
            placeholder="Example: Create a React component for user authentication with login and signup forms"
            className="bg-dark-surface"
            InputProps={{
              className: 'text-gray-100',
            }}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Model Selection */}
            <FormControl fullWidth error={!!errors.model}>
              <InputLabel>Model</InputLabel>
              <Select
                {...register('model', { required: 'Model is required' })}
                value={watchModel}
                label="Model"
                className="bg-dark-surface"
              >
                {models.map((model) => (
                  <MenuItem key={model.value} value={model.value}>
                    <div className="flex items-center space-x-2">
                      <span>{model.icon}</span>
                      <span>{model.label}</span>
                    </div>
                  </MenuItem>
                ))}
              </Select>
              {errors.model && (
                <FormHelperText>{errors.model.message}</FormHelperText>
              )}
            </FormControl>

            {/* Approval Mode */}
            <FormControl fullWidth error={!!errors.approvalMode}>
              <InputLabel>Approval Mode</InputLabel>
              <Select
                {...register('approvalMode', { required: 'Approval mode is required' })}
                value={watchApprovalMode}
                label="Approval Mode"
                className="bg-dark-surface"
              >
                {approvalModes.map((mode) => (
                  <MenuItem key={mode.value} value={mode.value}>
                    <div>
                      <div>{mode.label}</div>
                      <div className="text-xs text-gray-400">{mode.description}</div>
                    </div>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Reasoning Effort */}
            <FormControl fullWidth>
              <InputLabel>Reasoning Effort</InputLabel>
              <Select
                {...register('reasoningEffort')}
                defaultValue="medium"
                label="Reasoning Effort"
                className="bg-dark-surface"
              >
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
              </Select>
            </FormControl>
          </div>
        </div>

        {/* Advanced Options */}
        <div className="glass rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full px-6 py-4 flex items-center justify-between
                     text-left hover:bg-dark-hover transition-colors"
          >
            <div className="flex items-center space-x-3">
              <CodeIcon className="text-accent-secondary" />
              <span className="font-medium">Advanced Options</span>
            </div>
            <IconButton size="small">
              {showAdvanced ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </button>

          <Collapse in={showAdvanced}>
            <div className="px-6 pb-6 pt-2 space-y-4 border-t border-dark-border">
              {/* Project Type */}
              <FormControl fullWidth>
                <InputLabel>Project Type</InputLabel>
                <Select
                  {...register('projectType')}
                  label="Project Type"
                  className="bg-dark-surface"
                  defaultValue=""
                >
                  <MenuItem value="">
                    <em>None</em>
                  </MenuItem>
                  {projectTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>
                  Helps Codex understand your project context
                </FormHelperText>
              </FormControl>

              {/* Additional Instructions */}
              <TextField
                {...register('additionalInstructions')}
                label="Additional Instructions"
                multiline
                rows={3}
                fullWidth
                placeholder="Any specific requirements, coding standards, or preferences..."
                className="bg-dark-surface"
                InputProps={{
                  className: 'text-gray-100',
                }}
              />
            </div>
          </Collapse>
        </div>

        {/* Submit Button */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            disabled={isSubmitting}
            className="bg-gradient-to-r from-accent-primary to-accent-secondary
                     hover:shadow-lg hover:shadow-accent-primary/30
                     disabled:from-gray-600 disabled:to-gray-700"
            startIcon={isSubmitting ? (
              <CircularProgress size={20} className="text-white" />
            ) : (
              <SendIcon />
            )}
          >
            {isSubmitting ? 'Creating Job...' : 'Start Job'}
          </Button>
        </motion.div>

      </form>
    </motion.div>
  );
};