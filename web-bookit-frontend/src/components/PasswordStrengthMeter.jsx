import React, { useState } from 'react';
import zxcvbn from 'zxcvbn';
import { sanitizeInput } from '../utils/sanitize';

const requirements = [
  {
    label: 'At least 10 characters',
    test: (pw) => pw.length >= 10,
  },
  {
    label: 'One uppercase letter',
    test: (pw) => /[A-Z]/.test(pw),
  },
  {
    label: 'One lowercase letter',
    test: (pw) => /[a-z]/.test(pw),
  },
  {
    label: 'One number',
    test: (pw) => /[0-9]/.test(pw),
  },
  {
    label: 'One special character',
    test: (pw) => /[^A-Za-z0-9]/.test(pw),
  },
];

const strengthLabels = ['Weak', 'Weak', 'Medium', 'Strong', 'Very Strong'];
const strengthColors = ['bg-red-500', 'bg-red-500', 'bg-yellow-500', 'bg-green-500', 'bg-green-700'];

const PasswordStrengthMeter = ({ password }) => {
  // Sanitize the password input to prevent XSS
  const sanitizedPassword = sanitizeInput(password || '');
  const score = zxcvbn(sanitizedPassword).score;
  const unmet = requirements.filter(r => !r.test(sanitizedPassword));

  return (
    <div className="mt-2">
      <div className={`h-2 rounded ${strengthColors[score]} transition-all`} style={{ width: `${(score + 1) * 20}%` }} />
      <div className="mt-1 text-sm font-medium">
        Strength: <span className={score >= 3 ? 'text-green-600' : score === 2 ? 'text-yellow-600' : 'text-red-600'}>{strengthLabels[score]}</span>
      </div>
      <ul className="mt-1 text-xs text-gray-600">
        {requirements.map((r, i) => (
          <li key={i} className={r.test(sanitizedPassword) ? 'text-green-600' : 'text-red-600'}>
            {r.label}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PasswordStrengthMeter;