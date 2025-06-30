import React, { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
} from '@mui/material';
import { UserInputRequest } from '../types';

interface UserInputDialogProps {
  inputRequest: UserInputRequest;
  onSubmit: (response: string) => void;
}

export const UserInputDialog: React.FC<UserInputDialogProps> = ({
  inputRequest,
  onSubmit,
}) => {
  const [response, setResponse] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus the input when dialog opens
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSubmit = () => {
    if (response.trim()) {
      onSubmit(response);
      setResponse('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Dialog
      open={true}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: 'rgba(23, 23, 23, 0.95)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        },
      }}
    >
      <DialogTitle sx={{ color: 'rgb(59, 130, 246)' }}>
        Agent Needs Your Input
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body1" sx={{ color: 'rgb(209, 213, 219)' }}>
            {inputRequest.prompt}
          </Typography>
          {inputRequest.context && (
            <Typography
              variant="body2"
              sx={{ color: 'rgb(156, 163, 175)', mt: 1 }}
            >
              {inputRequest.context}
            </Typography>
          )}
        </Box>
        <TextField
          inputRef={inputRef}
          fullWidth
          multiline
          rows={3}
          value={response}
          onChange={(e) => setResponse(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your response here..."
          variant="outlined"
          sx={{
            '& .MuiOutlinedInput-root': {
              color: 'rgb(209, 213, 219)',
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              '& fieldset': {
                borderColor: 'rgba(255, 255, 255, 0.1)',
              },
              '&:hover fieldset': {
                borderColor: 'rgba(255, 255, 255, 0.2)',
              },
              '&.Mui-focused fieldset': {
                borderColor: 'rgb(59, 130, 246)',
              },
            },
            '& .MuiInputBase-input': {
              fontFamily: 'monospace',
            },
          }}
        />
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!response.trim()}
          sx={{
            backgroundColor: 'rgb(59, 130, 246)',
            '&:hover': {
              backgroundColor: 'rgb(37, 99, 235)',
            },
            '&:disabled': {
              backgroundColor: 'rgba(59, 130, 246, 0.3)',
            },
          }}
        >
          Send Response
        </Button>
      </DialogActions>
    </Dialog>
  );
};