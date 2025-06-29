import React, { useMemo } from 'react';
import MonacoEditor from '@monaco-editor/react';
import { Event, EventType } from '../types';
import { Tab, Tabs, Box } from '@mui/material';

interface CodeDisplayProps {
  events: Event[];
}

interface FileChange {
  path: string;
  content: string;
  language: string;
}

export const CodeDisplay: React.FC<CodeDisplayProps> = ({ events }) => {
  const [activeTab, setActiveTab] = React.useState(0);

  const fileChanges = useMemo(() => {
    const changes: FileChange[] = [];
    
    events.forEach((event) => {
      if (event.type === EventType.FILE_CHANGED && event.data.diff) {
        const extension = event.data.path.split('.').pop() || 'txt';
        const language = getLanguageFromExtension(extension);
        
        changes.push({
          path: event.data.path,
          content: event.data.diff,
          language,
        });
      }
    });
    
    return changes;
  }, [events]);

  if (fileChanges.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-gray-400 text-center">
          <p className="text-lg mb-2">No code changes yet</p>
          <p className="text-sm">File modifications will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* File Tabs */}
      <div className="border-b border-dark-border">
        <Tabs
          value={activeTab}
          onChange={(_, value) => setActiveTab(value)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root': {
              color: 'rgb(156, 163, 175)',
              textTransform: 'none',
              minHeight: '40px',
              '&.Mui-selected': {
                color: 'rgb(139, 92, 246)',
              },
            },
            '& .MuiTabs-indicator': {
              backgroundColor: 'rgb(139, 92, 246)',
            },
          }}
        >
          {fileChanges.map((file, index) => (
            <Tab
              key={index}
              label={
                <div className="flex items-center space-x-2">
                  <span className="text-xs">{getFileIcon(file.language)}</span>
                  <span>{file.path.split('/').pop()}</span>
                </div>
              }
            />
          ))}
        </Tabs>
      </div>

      {/* Code Editor */}
      <div className="flex-1">
        {fileChanges.map((file, index) => (
          <Box key={index} hidden={activeTab !== index} className="h-full">
            <MonacoEditor
              height="100%"
              language={file.language}
              value={file.content}
              theme="vs-dark"
              options={{
                readOnly: true,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                fontSize: 14,
                lineNumbers: 'on',
                wordWrap: 'on',
                automaticLayout: true,
                padding: { top: 16, bottom: 16 },
              }}
            />
          </Box>
        ))}
      </div>
    </div>
  );
};

function getLanguageFromExtension(extension: string): string {
  const languageMap: Record<string, string> = {
    ts: 'typescript',
    tsx: 'typescript',
    js: 'javascript',
    jsx: 'javascript',
    py: 'python',
    rs: 'rust',
    go: 'go',
    java: 'java',
    cpp: 'cpp',
    c: 'c',
    cs: 'csharp',
    rb: 'ruby',
    php: 'php',
    swift: 'swift',
    kt: 'kotlin',
    scala: 'scala',
    r: 'r',
    m: 'objective-c',
    json: 'json',
    xml: 'xml',
    html: 'html',
    css: 'css',
    scss: 'scss',
    sass: 'sass',
    less: 'less',
    sql: 'sql',
    md: 'markdown',
    yaml: 'yaml',
    yml: 'yaml',
    toml: 'toml',
    ini: 'ini',
    sh: 'shell',
    bash: 'shell',
    ps1: 'powershell',
    dockerfile: 'dockerfile',
    diff: 'diff',
  };

  return languageMap[extension.toLowerCase()] || 'plaintext';
}

function getFileIcon(language: string): string {
  const iconMap: Record<string, string> = {
    typescript: '📘',
    javascript: '📙',
    python: '🐍',
    rust: '🦀',
    go: '🐹',
    java: '☕',
    ruby: '💎',
    php: '🐘',
    html: '🌐',
    css: '🎨',
    json: '📋',
    markdown: '📝',
    shell: '🖥️',
    diff: '📊',
  };

  return iconMap[language] || '📄';
}