"use client";

import { useState, useEffect } from "react";

export default function Form() {
  const [message, setMessage] = useState("");
  const [key, setKey] = useState("");
  const [operation, setOperation] = useState("encrypt");
  const [algorithm, setAlgorithm] = useState("otp");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [keyPlaceholder, setKeyPlaceholder] = useState("Enter encryption key");

  // Update key placeholder based on algorithm and operation
  useEffect(() => {
    let placeholder = operation === "encrypt" ? "Enter encryption key" : "Enter decryption key";
    
    if (algorithm === "rsa") {
      placeholder = "RSA uses server keys - no input needed";
    } else if (algorithm === "otp" && operation === 'encrypt') {
      placeholder += ` (${message.length} characters)`;
    } else if (algorithm === "3des") {
      placeholder += " (16 or 24 characters)";
    } else if (algorithm === "aes") {
      placeholder += " (16, 24, or 32 characters)";
    }
    
    setKeyPlaceholder(placeholder);
  }, [algorithm, operation, message.length]);

  // Auto-adjust OTP key length when message changes
  useEffect(() => {
    if (algorithm === "otp" && message.length !== key.length && operation === 'encrypt') {
      setKey(prev => prev.slice(0, message.length).padEnd(message.length, "0"));
    }
  }, [message, algorithm]);

  const validateInputs = () => {
    setError("");

    if (!message) {
      setError("Message cannot be empty");
      return false;
    }

    if (algorithm !== "rsa" && !key) {
      setError("Key cannot be empty");
      return false;
    }

    if (algorithm === "otp" && operation === 'encrypt') {
      if (key.length !== message.length) {
        setError("For OTP, key length must match message length");
        return false;
      }
    } 
    else if (algorithm === "3des") {
      if (![16, 24].includes(key.length)) {
        setError("3DES requires 16 or 24 character key");
        return false;
      }

      if (key.length === 16 && key.slice(0, 8) === key.slice(8, 16)) {
        setError("Weak 3DES key: First and second parts are identical");
        return false;
      }
      if (key.length === 24 && key.slice(0, 8) === key.slice(8, 16) && key.slice(8, 16) === key.slice(16, 24)) {
        setError("Weak 3DES key: All key parts are identical");
        return false;
      }
    }
    else if (algorithm === "aes") {
      if (![16, 24, 32].includes(key.length)) {
        setError("AES requires 16, 24, or 32 character key");
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateInputs()) return;

    const endpoint = operation === "encrypt" ? "encrypt" : "decrypt";
    const url = `http://localhost:5000/${endpoint}`;

    const payload = {
      message: message,
      algorithm: algorithm,
      ...(algorithm !== "rsa" && { key: key }) // Only include key for non-RSA
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error: ${response.status}`);
      }

      const data = await response.json();
      setResult(data.encrypted_message || data.decrypted_message || "No result received");
      setError("");
    } catch (error) {
      setResult("");
      if (error instanceof Error) {
        setError(error.message || "An error occurred");
      } else {
        setError("An error occurred");
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-700 p-4">
      <form
        className="bg-gray-300 shadow-md rounded-lg px-8 pt-6 pb-8 mb-4 w-full max-w-2xl"
        onSubmit={handleSubmit}
      >
        <h1 className="text-2xl text-gray-700 font-bold mb-6 text-center">
          {operation.toUpperCase()} WITH {algorithm.toUpperCase()}
        </h1>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Message
          </label>
          <textarea
            placeholder={`Enter message to ${operation}`}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-32 resize-none"
          />
        </div>

        {algorithm !== "rsa" && (
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              {operation === "encrypt" ? "Encryption Key" : "Decryption Key"}
            </label>
            <input
              type="text"
              placeholder={keyPlaceholder}
              value={key}
              onChange={(e) => setKey(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Algorithm
            </label>
            <select
              value={algorithm}
              onChange={(e) => setAlgorithm(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 bg-gray-700 text-white focus:outline-none focus:shadow-outline"
            >
              <option value="otp">OTP</option>
              <option value="3des">3DES</option>
              <option value="aes">AES</option>
              <option value="rsa">RSA</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Operation
            </label>
            <select
              value={operation}
              onChange={(e) => setOperation(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 bg-gray-700 text-white focus:outline-none focus:shadow-outline"
            >
              <option value="encrypt">Encrypt</option>
              <option value="decrypt">Decrypt</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-colors"
        >
          {operation === "encrypt" ? "ENCRYPT NOW" : "DECRYPT NOW"}
        </button>

        <div className="mt-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Result
          </label>
          <textarea
            value={result}
            readOnly
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-100 h-48 resize-none"
            placeholder={`${operation === "encrypt" ? "Encrypted" : "Decrypted"} result will appear here...`}
          />
        </div>
      </form>
    </div>
  );
}