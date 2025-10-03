"use client";

import React, { useState, useEffect } from "react";
import { socketClient } from "@/lib/socket-client";

export default function SocketTestPage() {
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  const [messages, setMessages] = useState<string[]>([]);
  const [token, setToken] = useState("");

  useEffect(() => {
    // Check if already connected
    if (socketClient.isConnected()) {
      setConnectionStatus("connected");
    }

    // Listen for connection events
    const handleConnect = () => {
      setConnectionStatus("connected");
      addMessage("Connected to socket server");
    };

    const handleDisconnect = () => {
      setConnectionStatus("disconnected");
      addMessage("Disconnected from socket server");
    };

    const handleError = (error: any) => {
      addMessage(`Socket error: ${error.message || error}`);
    };

    socketClient.on("connect", handleConnect);
    socketClient.on("disconnect", handleDisconnect);
    socketClient.on("connect_error", handleError);

    return () => {
      socketClient.off("connect", handleConnect);
      socketClient.off("disconnect", handleDisconnect);
      socketClient.off("connect_error", handleError);
    };
  }, []);

  const addMessage = (message: string) => {
    setMessages(prev => [...prev, `${new Date().toISOString()}: ${message}`]);
  };

  const handleConnect = () => {
    if (!token) {
      addMessage("Please enter a token first");
      return;
    }

    try {
      socketClient.connect(token);
      addMessage("Attempting to connect to socket server...");
    } catch (error: any) {
      addMessage(`Connection error: ${error.message || error}`);
    }
  };

  const handleDisconnect = () => {
    try {
      socketClient.disconnect();
      addMessage("Disconnected from socket server");
    } catch (error: any) {
      addMessage(`Disconnection error: ${error.message || error}`);
    }
  };

  const handleJoinNotifications = () => {
    try {
      socketClient.joinNotifications();
      addMessage("Joined notifications channel");
    } catch (error: any) {
      addMessage(`Join notifications error: ${error.message || error}`);
    }
  };

  const handleSendHeartbeat = () => {
    try {
      socketClient.sendHeartbeat();
      addMessage("Heartbeat sent");
    } catch (error: any) {
      addMessage(`Heartbeat error: ${error.message || error}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Socket.IO Test Page</h1>
        
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h2 className="text-xl font-semibold text-blue-800 mb-2">Connection Status</h2>
          <div className="flex items-center">
            <div className={`w-4 h-4 rounded-full mr-2 ${connectionStatus === "connected" ? "bg-green-500" : "bg-red-500"}`}></div>
            <span className="font-medium">{connectionStatus}</span>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="token">
            Auth Token
          </label>
          <input
            id="token"
            type="text"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Enter auth token"
          />
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          <button
            onClick={handleConnect}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Connect
          </button>
          
          <button
            onClick={handleDisconnect}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Disconnect
          </button>
          
          <button
            onClick={handleJoinNotifications}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Join Notifications
          </button>
          
          <button
            onClick={handleSendHeartbeat}
            className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Send Heartbeat
          </button>
        </div>

        <div className="mb-4">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Messages</h2>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 h-64 overflow-y-auto">
            {messages.length === 0 ? (
              <p className="text-gray-500">No messages yet. Try connecting to the socket server.</p>
            ) : (
              <ul className="space-y-2">
                {messages.map((message, index) => (
                  <li key={index} className="text-sm font-mono text-gray-700 p-2 bg-white rounded border">
                    {message}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Instructions:</strong> Make sure you're running the custom server with `npm run dev`.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}