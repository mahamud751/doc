"use client";

import React, { useState, useEffect } from "react";
import { socketClient } from "@/lib/socket-client";

export default function TestSocketPage() {
  const [status, setStatus] = useState("disconnected");
  const [messages, setMessages] = useState<string[]>([]);
  const [token, setToken] = useState("");

  useEffect(() => {
    const handleConnect = () => {
      setStatus("connected");
      addMessage("Connected to socket server");
    };

    const handleDisconnect = () => {
      setStatus("disconnected");
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
    setMessages(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const handleConnect = () => {
    if (!token) {
      alert("Please enter a token first");
      return;
    }

    try {
      socketClient.connect(token);
      addMessage("Attempting to connect...");
    } catch (error: any) {
      addMessage(`Connection failed: ${error.message}`);
    }
  };

  const handleDisconnect = () => {
    try {
      socketClient.disconnect();
      addMessage("Disconnected");
    } catch (error: any) {
      addMessage(`Disconnection failed: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-4">Socket.IO Test</h1>
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Auth Token
          </label>
          <input
            type="text"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Enter auth token"
          />
        </div>

        <div className="mb-4">
          <p className="font-semibold">Connection Status: 
            <span className={`ml-2 ${status === 'connected' ? 'text-green-600' : 'text-red-600'}`}>
              {status}
            </span>
          </p>
        </div>

        <div className="flex space-x-2 mb-4">
          <button
            onClick={handleConnect}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            Connect
          </button>
          <button
            onClick={handleDisconnect}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          >
            Disconnect
          </button>
        </div>

        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2">Messages</h2>
          <div className="bg-gray-50 border border-gray-200 rounded p-3 h-48 overflow-y-auto">
            {messages.length === 0 ? (
              <p className="text-gray-500">No messages yet</p>
            ) : (
              <ul className="space-y-1">
                {messages.map((msg, index) => (
                  <li key={index} className="text-sm">{msg}</li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="mt-4 p-3 bg-yellow-100 border border-yellow-400 rounded">
          <p className="text-sm text-yellow-700">
            <strong>Note:</strong> Make sure to run the custom server with `npm run dev` 
            (not `next dev`) for Socket.IO to work properly.
          </p>
        </div>
      </div>
    </div>
  );
}