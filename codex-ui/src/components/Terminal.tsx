import React, { useEffect, useRef } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
import { Event, EventType } from '../types';
import 'xterm/css/xterm.css';

interface TerminalProps {
  events: Event[];
}

export const Terminal: React.FC<TerminalProps> = ({ events }) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);

  useEffect(() => {
    if (!terminalRef.current || xtermRef.current) return;

    // Initialize terminal
    const term = new XTerm({
      theme: {
        background: '#000000',
        foreground: '#00ff00',
        cursor: '#00ff00',
        cursorAccent: '#000000',
        selection: 'rgba(255, 255, 255, 0.3)',
        black: '#000000',
        red: '#ff5555',
        green: '#50fa7b',
        yellow: '#f1fa8c',
        blue: '#bd93f9',
        magenta: '#ff79c6',
        cyan: '#8be9fd',
        white: '#bbbbbb',
        brightBlack: '#555555',
        brightRed: '#ff5555',
        brightGreen: '#50fa7b',
        brightYellow: '#f1fa8c',
        brightBlue: '#bd93f9',
        brightMagenta: '#ff79c6',
        brightCyan: '#8be9fd',
        brightWhite: '#ffffff',
      },
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      fontSize: 14,
      lineHeight: 1.2,
      cursorBlink: true,
      convertEol: true,
      scrollback: 10000,
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();

    term.loadAddon(fitAddon);
    term.loadAddon(webLinksAddon);

    term.open(terminalRef.current);
    fitAddon.fit();

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    // Welcome message
    term.writeln('\x1b[1;32mCodex Terminal\x1b[0m');
    term.writeln('\x1b[90m────────────────────────────────────────\x1b[0m');
    term.writeln('');

    // Handle window resize
    const handleResize = () => {
      fitAddonRef.current?.fit();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      term.dispose();
    };
  }, []);

  useEffect(() => {
    if (!xtermRef.current) return;

    const term = xtermRef.current;
    
    // Clear terminal and replay all events from the beginning
    term.clear();
    
    // Welcome message
    term.writeln('\x1b[1;32mCodex Terminal\x1b[0m');
    term.writeln('\x1b[90m────────────────────────────────────────\x1b[0m');
    term.writeln('');

    // Process all events
    console.log(`Terminal: Processing ${events.length} events`);
    events.forEach((event) => {
      console.log(`Terminal: Processing event type ${event.type}`, event.data);
      switch (event.type) {
        case EventType.TOOL_EXECUTING:
          if (event.data.command) {
            term.writeln(`\x1b[1;33m$ ${event.data.command}\x1b[0m`);
          }
          break;

        case EventType.STDOUT:
          if (event.data.content) {
            // Write content directly, preserving formatting
            term.write(event.data.content);
            // Add newline if content doesn't end with one
            if (!event.data.content.endsWith('\n')) {
              term.write('\n');
            }
          }
          break;

        case EventType.STDERR:
          if (event.data.content) {
            // Write error content in red
            term.write(`\x1b[1;31m${event.data.content}\x1b[0m`);
            // Add newline if content doesn't end with one
            if (!event.data.content.endsWith('\n')) {
              term.write('\n');
            }
          }
          break;

        case EventType.TOOL_COMPLETED:
          if (event.data.exitCode !== undefined) {
            const color = event.data.exitCode === 0 ? '32' : '31';
            term.writeln(`\x1b[1;${color}m[Exit code: ${event.data.exitCode}]\x1b[0m`);
            term.writeln('');
          }
          break;

        case EventType.JOB_STARTED:
          term.writeln('\x1b[1;36m[Job Started]\x1b[0m');
          term.writeln('');
          break;

        case EventType.JOB_COMPLETED:
          term.writeln('');
          term.writeln('\x1b[1;32m[Job Completed Successfully]\x1b[0m');
          break;

        case EventType.JOB_FAILED:
          term.writeln('');
          term.writeln(`\x1b[1;31m[Job Failed: ${event.data.error || 'Unknown error'}]\x1b[0m`);
          break;
      }
    });

    // Scroll to bottom
    term.scrollToBottom();
  }, [events]);

  return (
    <div className="h-full bg-black p-4">
      <div ref={terminalRef} className="h-full" />
    </div>
  );
};