"use client";

import { useState, useEffect } from "react";

export default function Form() {
  const [number, setNumber] = useState("");
  const [key, setKey] = useState("");
  const [operation, setOperation] = useState("encrypt");
  const [algorithm, setAlgorithm] = useState("otp");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [keyPlaceholder, setKeyPlaceholder] = useState("Enter encryption key");

  // Update key placeholder based on algorithm and operation
  useEffect(() => {
    let placeholder = operation === "encrypt" ? "Enter encryption key" : "Enter decryption key";
    
    if (algorithm === "otp" && operation === 'encrypt' ) {
      placeholder += ` (${number.length} characters)`;
    } else if (algorithm === "3des") {
      placeholder += " (16 or 24 characters)";
    } else if (algorithm === "aes") {
      placeholder += " (16, 24, or 32 characters)";
    }
    
    setKeyPlaceholder(placeholder);
  }, [algorithm, operation, number.length]);

  // Auto-adjust OTP key length when message changes
  useEffect(() => {
    if ((algorithm === "otp" && number.length !== key.length) && operation === 'encrypt') {
      setKey(prev => {
        if (prev.length > number.length) {
          return prev.slice(0, number.length);
        }
        return prev.padEnd(number.length, ""); // Pad with zeros by default
      });
    }
  }, [number, algorithm]);

  const validateInputs = () => {
    setError("");

    if (!number) {
      setError("Message cannot be empty");
      return false;
    }

    if (!key) {
      setError("Key cannot be empty");
      return false;
    }

    if (algorithm === "otp" && operation === 'encrypt') {
      if (key.length !== number.length) {
        setError("For OTP, key length must match message length");
        return false;
      }
    } 
    else if (algorithm === "3des") {
      if (![16, 24].includes(key.length)) {
        setError("3DES requires 16 or 24 character key");
        return false;
      }

      // Check for weak keys (simple frontend check)
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

    if (!validateInputs()) {
      return;
    }

    const endpoint = operation === "encrypt" ? "encrypt" : "decrypt";
    const url = `http://localhost:5000/${endpoint}`;

    const payload = {
      message: number,
      key: key,
      algorithm: algorithm
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error: ${response.status}`);
      }

      const data = await response.json();
      setResult(data.encrypted_message || data.decrypted_message ||"No result received");
      setError("");
    } catch (error) {
      setResult("");
      setError(error.message || "An error occurred");
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-700">
      <form
        className="bg-gray-300 shadow-md rounded px-20 pt-18 pb-8 mb-4"
        onSubmit={handleSubmit}
      >
        <h1 className="text-2xl text-gray-700 font-bold mb-4">Encrypt / Decrypt</h1>

        {/* Error Message Display */}
        {error && (
          <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Text Field for Message */}
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Message
          </label>
          <input
            type="text"
            placeholder="Enter message"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>

        {/* Text Field for Key */}
        <div className="mb-4">
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

        {/* Algorithm Selection */}
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Choose Algorithm
          </label>
          <select
            value={algorithm}
            onChange={(e) => setAlgorithm(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 bg-gray-700 text-white leading-tight focus:outline-none focus:shadow-outline"
          >
            <option value="otp">OTP</option>
            <option value="3des">3DES</option>
            <option value="aes">AES</option>
          </select>
        </div>

        {/* Operation Selection */}
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Choose Operation
          </label>
          <select
            value={operation}
            onChange={(e) => setOperation(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 bg-gray-700 text-white leading-tight focus:outline-none focus:shadow-outline"
          >
            <option value="encrypt">Encrypt</option>
            <option value="decrypt">Decrypt</option>
          </select>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          {operation === "encrypt" ? "Encrypt" : "Decrypt"}
        </button>

        {/* Result Display */}
        <div className="rounded px-6 pt-4 pb-4 mt-4 w-full max-w-md">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Result
          </label>
          <input
            type="text"
            value={result}
            readOnly
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-100"
          />
        </div>
      </form>
    </div>
  );
}