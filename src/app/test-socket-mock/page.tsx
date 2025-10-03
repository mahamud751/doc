'use client';

import { useEffect, useState } from 'react';
import { socketClient } from '@/lib/socket-client';

export default function TestSocketMock() {
  const [messages, setMessages] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Connect to the mock socket
    socketClient.connect('test-token');
    
    // Listen for connection events
    const handleConnect = () => {
      setIsConnected(true);
      console.log('Socket connected (mock mode)');
    };
    
    const handleMessage = (data: any) => {
      setMessages(prev => [...prev, data]);
      console.log('Received message:', data);
    };
    
    // Set up event listeners
    window.addEventListener('socketConnected', handleConnect);
    socketClient.on('new-message', handleMessage);
    
    // Simulate receiving a message after 2 seconds
    const messageTimeout = setTimeout(() => {
      socketClient.simulateMessage({
        id: '1',
        message: 'Hello from mock socket!',
        from: {
          id: 'user1',
          name: 'Test User',
          role: 'PATIENT'
        },
        timestamp: new Date().toISOString(),
        appointmentId: 'appointment1'
      });
    }, 2000);
    
    // Simulate receiving an order update after 4 seconds
    const orderTimeout = setTimeout(() => {
      socketClient.simulateOrderUpdate({
        orderId: 'order1',
        status: 'confirmed',
        orderType: 'lab_test',
        patientId: 'patient1',
        timestamp: new Date().toISOString()
      });
    }, 4000);
    
    // Cleanup
    return () => {
      window.removeEventListener('socketConnected', handleConnect);
      socketClient.off('new-message', handleMessage);
      clearTimeout(messageTimeout);
      clearTimeout(orderTimeout);
      socketClient.disconnect();
    };
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Socket Mock Test</h1>
      <div className="mb-4">
        <p>Status: {isConnected ? 'Connected (Mock Mode)' : 'Connecting...'}</p>
      </div>
      
      <div className="mb-4">
        <button 
          onClick={() => {
            socketClient.sendMessage({
              appointmentId: 'test-appointment',
              message: 'Test message from UI',
              toUserId: 'doctor1'
            });
          }}
          className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
        >
          Send Test Message
        </button>
        
        <button 
          onClick={() => {
            socketClient.updateStatus('online');
          }}
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Set Status Online
        </button>
      </div>
      
      <div>
        <h2 className="text-xl font-semibold mb-2">Received Messages</h2>
        {messages.length === 0 ? (
          <p>No messages yet...</p>
        ) : (
          <ul className="space-y-2">
            {messages.map((msg, index) => (
              <li key={index} className="border p-2 rounded">
                <pre>{JSON.stringify(msg, null, 2)}</pre>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}