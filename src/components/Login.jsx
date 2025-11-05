import React, { useState } from 'react';
import axios from 'axios';

function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const { email, password } = formData;

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    const user = {
      email,
      password,
    };

    try {
      // 1. Send the POST request to our NEW login endpoint
      const res = await axios.post(
        'https://cloudcharge-backend.onrender.com/api/users/login',
        user
      );

      // 2. Log the response (user and token)
      console.log('LOGIN SUCCESS!', res.data);
      alert('Login successful! Check the console.');
      
      // **IMPORTANT**: This is where you would save the token
      // to local storage and update your app's state
      // (e.g., localStorage.setItem('token', res.data.token));

    } catch (err) {
      // 3. Log any errors
      console.error('ERROR logging in:', err.response.data.message);
      alert(`Error: ${err.response.data.message}`);
    }
  };

  // The HTML form (almost identical to Register, but no "name" field)
  return (
    <div className="w-full max-w-xs mx-auto mt-20">
      <form
        onSubmit={onSubmit}
        className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4"
      >
        <h2 className="text-2xl font-bold text-center mb-6">Login</h2>
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
            Email
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
            id="email"
            type="email"
            placeholder="your@email.com"
            name="email"
            value={email}
            onChange={onChange}
            required
          />
        </div>
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
            Password
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
            id="password"
            type="password"
            placeholder="******************"
            name="password"
            value={password}
            onChange={onChange}
            required
          />
        </div>
        <div className="flex items-center justify-between">
          <button
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            type="submit"
          >
            Sign In
          </button>
        </div>
      </form>
    </div>
  );
}

export default Login;