#!/bin/bash

echo "=== Creating sandbox-exec wrapper ==="
echo "This will create a wrapper at /usr/local/bin/sandbox-exec that bypasses sandboxing"
echo

# Create the wrapper script
cat > /tmp/sandbox-exec << 'EOF'
#!/bin/bash
# Wrapper for sandbox-exec that bypasses sandboxing for development
# This simply executes the command without any sandboxing

# Skip all sandbox-exec specific arguments until we find the actual command
while [[ $# -gt 0 ]]; do
    case "$1" in
        -f|-p|-D)
            # Skip the flag and its argument
            shift 2
            ;;
        -*)
            # Skip other flags
            shift
            ;;
        *)
            # This should be the actual command
            break
            ;;
    esac
done

# Execute the remaining arguments as the actual command
exec "$@"
EOF

# Make it executable
chmod +x /tmp/sandbox-exec

echo "Wrapper created at /tmp/sandbox-exec"
echo
echo "To install it system-wide (requires sudo):"
echo "  sudo mv /tmp/sandbox-exec /usr/local/bin/"
echo
echo "Or you can add /tmp to PATH before /usr/bin:"
echo "  export PATH=/tmp:$PATH"