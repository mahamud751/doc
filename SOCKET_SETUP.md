# Socket.IO Setup Instructions

## Problem Summary

You were experiencing socket connection timeout errors because Next.js doesn't natively support WebSocket connections without a custom server implementation.

## Solution Implemented

I've created a custom server (`server.js`) that:

1. Runs the Next.js application
2. Initializes Socket.IO server
3. Integrates with your existing socket server implementation

## Changes Made

### 1. Created Custom Server (`server.js`)

- Implements an HTTP server using Node.js `http` module
- Integrates Next.js application with the HTTP server
- Initializes Socket.IO with the HTTP server
- Maintains all existing functionality

### 2. Updated Package.json Scripts

- Changed `dev` script from `next dev` to `node server.js`
- Updated `start` script to use the custom server in production

## How It Works

The custom server:

1. Creates an HTTP server
2. Prepares the Next.js application
3. Handles all HTTP requests through Next.js
4. Initializes Socket.IO on the same server instance
5. Uses your existing socket server implementation

## Running the Application

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm run build
npm run start
```

## Environment Variables

Make sure your `.env` file contains:

```
NEXT_PUBLIC_SOCKET_URL="http://localhost:3000"
```

This should match the server URL where your application is running.

## Testing Socket Connection

After restarting your server, the socket connection should work properly. You can verify this by:

1. Opening your patient dashboard
2. Checking the browser console for socket connection messages
3. Looking for "Connected to socket server" in the console

## Troubleshooting

### If Socket Connection Still Fails

1. Check that the server is running on the correct port
2. Verify that `NEXT_PUBLIC_SOCKET_URL` in your `.env` file matches your server URL
3. Check browser console for any error messages
4. Ensure no firewall is blocking WebSocket connections

### If Next.js Features Don't Work

1. Make sure all Next.js API routes are still accessible
2. Verify that static files are served correctly
3. Check that there are no conflicts between Next.js and Socket.IO

## Reverting Changes

If you need to revert to the standard Next.js server:

1. Restore the original package.json scripts:
   ```json
   "scripts": {
     "dev": "next dev",
     "build": "next build",
     "start": "next start",
     "lint": "eslint",
     "seed": "tsx prisma/seed.ts"
   }
   ```
2. Delete the `server.js` file
3. Note that socket functionality will not work without the custom server

## Support

If you continue to experience issues:

1. Check the terminal where the server is running for error messages
2. Verify that the port is not being used by another application
3. Ensure all dependencies are properly installed
